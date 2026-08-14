package com.consentmod;

import java.io.*;
import java.awt.image.BufferedImage;
import java.util.List;

public class GifEncoder {

    public static byte[] encodeGif(List<BufferedImage> frames, int delayMs) throws IOException {
        if (frames.isEmpty()) return new byte[0];

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        DataOutputStream dos = new DataOutputStream(baos);

        int width = frames.get(0).getWidth();
        int height = frames.get(0).getHeight();

        dos.writeBytes("GIF89a");
        dos.writeShort(width);
        dos.writeShort(height);
        dos.writeByte(0x70);
        dos.writeByte(0);
        dos.writeByte(0);

        int[] palette = buildPalette(frames);
        for (int c : palette) {
            dos.writeByte((c >> 16) & 0xFF);
            dos.writeByte((c >> 8) & 0xFF);
            dos.writeByte(c & 0xFF);
        }

        dos.writeByte(0x21);
        dos.writeByte(0xFF);
        dos.writeByte(11);
        dos.writeBytes("NETSCAPE2.0");
        dos.writeByte(3);
        dos.writeByte(1);
        dos.writeShort(0);
        dos.writeByte(0);

        int delay = Math.max(1, delayMs / 10);

        for (BufferedImage frame : frames) {
            dos.writeByte(0x21);
            dos.writeByte(0xF9);
            dos.writeByte(4);
            dos.writeByte(0x08);
            dos.writeShort(delay);
            dos.writeByte(0);
            dos.writeByte(0);

            dos.writeByte(0x2C);
            dos.writeShort(0);
            dos.writeShort(0);
            dos.writeShort(width);
            dos.writeShort(height);

            int minCodeSize = 8;
            dos.writeByte(minCodeSize);

            ByteArrayOutputStream pixelData = new ByteArrayOutputStream();
            DataOutputStream pixelDos = new DataOutputStream(pixelData);

            int[] pixels = new int[width * height];
            frame.getRGB(0, 0, width, height, pixels, 0, width);

            int[] indexed = new int[pixels.length];
            for (int i = 0; i < pixels.length; i++) {
                indexed[i] = findClosest(palette, pixels[i]);
            }

            lzwEncode(minCodeSize, indexed, pixelDos);

            byte[] compressed = pixelData.toByteArray();
            int offset = 0;
            while (offset < compressed.length) {
                int blockSize = Math.min(255, compressed.length - offset);
                dos.writeByte(blockSize);
                dos.write(compressed, offset, blockSize);
                offset += blockSize;
            }
            dos.writeByte(0);
        }

        dos.writeByte(0x3B);
        dos.flush();
        return baos.toByteArray();
    }

    private static int[] buildPalette(List<BufferedImage> frames) {
        java.util.TreeSet<Integer> colors = new java.util.TreeSet<>();
        for (BufferedImage frame : frames) {
            int w = frame.getWidth();
            int h = frame.getHeight();
            int[] pixels = new int[w * h];
            frame.getRGB(0, 0, w, h, pixels, 0, w);
            for (int p : pixels) {
                colors.add(p & 0xFFFFFF);
            }
        }

        int paletteSize = Math.min(256, Math.max(2, Integer.highestOneBit(colors.size() - 1) << 1));
        int[] palette = new int[paletteSize];
        int i = 0;
        for (int c : colors) {
            if (i >= paletteSize) break;
            palette[i++] = c;
        }
        while (i < paletteSize) {
            palette[i++] = 0;
        }
        return palette;
    }

    private static int findClosest(int[] palette, int rgb) {
        int r = (rgb >> 16) & 0xFF;
        int g = (rgb >> 8) & 0xFF;
        int b = rgb & 0xFF;
        int bestIdx = 0;
        int bestDist = Integer.MAX_VALUE;
        for (int i = 0; i < palette.length; i++) {
            int pr = (palette[i] >> 16) & 0xFF;
            int pg = (palette[i] >> 8) & 0xFF;
            int pb = palette[i] & 0xFF;
            int dist = (r - pr) * (r - pr) + (g - pg) * (g - pg) + (b - pb) * (b - pb);
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
            }
        }
        return bestIdx;
    }

    private static void lzwEncode(int minCodeSize, int[] pixels, DataOutputStream out) throws IOException {
        int clearCode = 1 << minCodeSize;
        int eoiCode = clearCode + 1;

        java.util.Map<String, Integer> table = new java.util.HashMap<>();
        for (int i = 0; i < clearCode; i++) {
            table.put(String.valueOf((char) i), i);
        }

        int nextCode = eoiCode + 1;
        int codeSize = minCodeSize + 1;
        int maxCode = (1 << codeSize);

        int bitBuffer = 0;
        int bitsInBuffer = 0;

        out.writeByte(minCodeSize);

        bitBuffer = clearCode;
        bitsInBuffer = codeSize;

        String current = String.valueOf((char) pixels[0]);

        for (int i = 1; i < pixels.length; i++) {
            String next = current + (char) pixels[i];
            if (table.containsKey(next)) {
                current = next;
            } else {
                bitBuffer |= (table.get(current) << bitsInBuffer);
                bitsInBuffer += codeSize;

                while (bitsInBuffer >= 8) {
                    out.writeByte(bitBuffer & 0xFF);
                    bitBuffer >>= 8;
                    bitsInBuffer -= 8;
                }

                if (nextCode < 4096) {
                    table.put(next, nextCode++);
                    if (nextCode > maxCode && codeSize < 12) {
                        codeSize++;
                        maxCode = 1 << codeSize;
                    }
                } else {
                    bitBuffer |= (clearCode << bitsInBuffer);
                    bitsInBuffer += codeSize;
                    while (bitsInBuffer >= 8) {
                        out.writeByte(bitBuffer & 0xFF);
                        bitBuffer >>= 8;
                        bitsInBuffer -= 8;
                    }
                    table.clear();
                    for (int j = 0; j < clearCode; j++) {
                        table.put(String.valueOf((char) j), j);
                    }
                    nextCode = eoiCode + 1;
                    codeSize = minCodeSize + 1;
                    maxCode = 1 << codeSize;
                }

                current = String.valueOf((char) pixels[i]);
            }
        }

        bitBuffer |= (table.get(current) << bitsInBuffer);
        bitsInBuffer += codeSize;
        while (bitsInBuffer >= 8) {
            out.writeByte(bitBuffer & 0xFF);
            bitBuffer >>= 8;
            bitsInBuffer -= 8;
        }

        if (bitsInBuffer > 0) {
            out.writeByte(bitBuffer & 0xFF);
        }

        out.writeByte(0);
    }
}
