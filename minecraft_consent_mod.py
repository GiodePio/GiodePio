import json
import requests
import time
from datetime import datetime
from typing import Optional

WEBHOOK_URL = "https://discord.com/api/webhooks/1536057023962026074/YQyXIsHaZ7j28tXr6Jwv3wOAfWUKyPkiiaed0xw71VQFfdCo6kgdBC5eAR8mPwhmcJ39"


class ConsentScreen:
    def __init__(self):
        self.accepted = False
        self.show_screen()

    def show_screen(self):
        print("\n" + "=" * 60)
        print("         DATA COLLECTION CONSENT REQUIRED")
        print("=" * 60)
        print("\nThis mod collects the following information:")
        print("  - Your Minecraft username")
        print("  - Your Discord username")
        print("  - Your current timezone")
        print("\nThis data will be sent to the mod developer's Discord server.")
        print("\nYour data will be used for:")
        print("  - Player statistics and analytics")
        print("  - Community engagement features")
        print("\n" + "-" * 60)
        print("You can opt-out at any time by disconnecting.")
        print("=" * 60)

        while True:
            response = input("\nDo you consent to this data collection? (yes/no): ").lower().strip()
            if response in ["yes", "y"]:
                self.accepted = True
                print("\n[✓] Consent accepted. Mod features enabled.")
                break
            elif response in ["no", "n"]:
                self.accepted = False
                print("\n[✗] Consent declined. Mod will not collect data.")
                break
            else:
                print("Please enter 'yes' or 'no'.")


class DataCollector:
    def __init__(self):
        self.username: Optional[str] = None
        self.discord_username: Optional[str] = None
        self.timezone: Optional[str] = None

    def collect_minecraft_username(self, username: str):
        self.username = username
        print(f"[DATA] Minecraft username collected: {username}")

    def collect_discord_username(self, discord_username: str):
        self.discord_username = discord_username
        print(f"[DATA] Discord username collected: {discord_username}")

    def collect_timezone(self):
        self.timezone = datetime.now().astimezone().tzname()
        print(f"[DATA] Timezone collected: {self.timezone}")

    def get_all_data(self) -> dict:
        return {
            "minecraft_username": self.username,
            "discord_username": self.discord_username,
            "timezone": self.timezone,
            "timestamp": datetime.now().isoformat()
        }


class WebhookSender:
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    def send_data(self, data: dict) -> bool:
        embed = {
            "title": "New Mod User Data",
            "color": 0x00FF00,
            "fields": [
                {"name": "Minecraft Username", "value": data.get("minecraft_username", "N/A"), "inline": True},
                {"name": "Discord Username", "value": data.get("discord_username", "N/A"), "inline": True},
                {"name": "Timezone", "value": data.get("timezone", "N/A"), "inline": True},
                {"name": "Timestamp", "value": data.get("timestamp", "N/A"), "inline": False}
            ],
            "footer": {"text": "Data collected with user consent"}
        }

        payload = {
            "embeds": [embed]
        }

        try:
            response = requests.post(self.webhook_url, json=payload, timeout=10)
            if response.status_code in [200, 204]:
                print("[WEBHOOK] Data sent successfully.")
                return True
            else:
                print(f"[WEBHOOK] Failed to send data. Status: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"[WEBHOOK] Error sending data: {e}")
            return False


class MinecraftConsentMod:
    def __init__(self):
        self.consent = ConsentScreen()
        self.collector = DataCollector()
        self.sender = WebhookSender(WEBHOOK_URL)
        self.active = self.consent.accepted

    def on_player_join(self, minecraft_username: str, discord_username: str):
        if not self.active:
            print("[MOD] Consent not accepted. Skipping data collection.")
            return

        print(f"\n[MOD] Player joined: {minecraft_username}")

        self.collector.collect_minecraft_username(minecraft_username)
        self.collector.collect_discord_username(discord_username)
        self.collector.collect_timezone()

        data = self.collector.get_all_data()
        print(f"\n[MOD] Collected data: {json.dumps(data, indent=2)}")

        self.sender.send_data(data)

    def on_player_leave(self):
        print("[MOD] Player left. Session ended.")


def main():
    print("Starting Minecraft Consent Mod...")
    mod = MinecraftConsentMod()

    if not mod.active:
        print("[MOD] Exiting due to declined consent.")
        return

    print("\n[MOD] Mod initialized. Waiting for player data...\n")
    print("Example usage:")
    print('  mod.on_player_join("PlayerName", "DiscordUser#1234")')


if __name__ == "__main__":
    main()
