# Consent Mod (Fabric 1.21.1)

A Minecraft mod that collects user data with explicit consent via command.

## Setup

1. Install Java 21
2. Clone/download Fabric MDK
3. Copy these files into the MDK folder
4. Run: `./gradlew build`
5. Put jar from `build/libs/` into Minecraft `mods` folder

## Usage

1. Join a server with the mod installed
2. Read the consent message
3. Type `/consent accept` or `/consent decline`
4. If accepted, data is sent to Discord webhook

## Data Collected

- Minecraft username
- Discord username (N/A unless updated)
- Timezone
- Timestamp
