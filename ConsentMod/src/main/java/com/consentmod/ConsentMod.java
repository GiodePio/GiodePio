package com.consentmod;

import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.event.FMLInitializationEvent;
import net.minecraftforge.fml.common.event.FMLPreInitializationEvent;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

@Mod(modid = ConsentMod.MODID, name = ConsentMod.NAME, version = ConsentMod.VERSION)
public class ConsentMod {
    public static final String MODID = "consentmod";
    public static final String NAME = "Consent Data Mod";
    public static final String VERSION = "1.0.0";

    public static final Logger LOGGER = LogManager.getLogger(MODID);

    @Mod.Instance(MODID)
    public static ConsentMod instance;

    @Mod.EventHandler
    public void preInit(FMLPreInitializationEvent event) {
        LOGGER.info("Consent Mod pre-initializing...");
    }

    @Mod.EventHandler
    public void init(FMLInitializationEvent event) {
        LOGGER.info("Consent Mod initializing...");
        MinecraftForge.EVENT_BUS.register(new PlayerEventHandler());
    }
}
