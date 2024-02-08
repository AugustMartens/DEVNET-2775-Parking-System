import os
import pytz
import logging
import requests
import datetime
import time
import threading
from webex_bot.webex_bot import WebexBot
from webex_bot.models.command import Command
from webex_bot.models.response import Response
from adaptivecardbuilder import Fact, TextBlock, Image, AdaptiveCard

log = logging.getLogger(__name__)
bot = WebexBot(os.getenv("WEBEX_TOKEN"))

class ParkingStatus(Command):
    def __init__(self):
        super().__init__(
            command_keyword="go",
            help_message="Get the live parking status update.",
            card=None,
        )
        self.last_parking_data_time = None
        self.last_parking_data = None
        self.last_snapshot_time = None
        self.image_url = (
            "https://i.ibb.co/QHkJCvv/michael-fousert-tgpvj-Z-Yw6-Q-unsplash-1.jpg"
        )
        # Start the snapshot prefetching thread
        self.snapshot_thread = threading.Thread(
            target=self.snapshot_prefetch, daemon=True
        )
        self.snapshot_thread.start()

    def fetch_parking_data(self):
        current_time = time.time()
        if (
            self.last_parking_data_time
            and current_time - self.last_parking_data_time < 30
        ):
            return self.last_parking_data

        url = "https://getcollectiondata-e6qxwaplpa-ew.a.run.app"
        res = requests.get(url)
        if res.status_code != 200:
            log.error(f"Failed to fetch parking data: {res.content}")
            return self.last_parking_data

        self.last_parking_data_time = current_time
        self.last_parking_data = res.json()
        return self.last_parking_data

    def fetch_snapshot(self):
        current_time = time.time()
        if self.last_snapshot_time and current_time - self.last_snapshot_time < 60:
            log.info("Using cached snapshot")
            return self.image_url

        meraki_api_key = os.getenv("MERAKI_API_KEY")
        camera_serial = "Q2LV-JPQX-7KZU"
        snapshot_url = (
            "https://api.meraki.com/api/v1/devices/{}/camera/generateSnapshot".format(
                camera_serial
            )
        )

        headers = {
            "X-Cisco-Meraki-API-Key": meraki_api_key,
        }

        response = requests.post(snapshot_url, headers=headers)
        if response.status_code != 202:
            log.error(f"Failed to fetch snapshot: {response.content}")
            return self.image_url

        snapshot_data = response.json()

        self.last_snapshot_time = current_time
        self.image_url = snapshot_data["url"]
        log.info("Using new snapshot")

        return self.image_url

    def snapshot_prefetch(self):
        while True:
            try:
                self.fetch_snapshot()
                log.info("Snapshot URL refreshed: " + self.image_url)
            except Exception as e:
                log.error(f"Failed to prefetch snapshot: {str(e)}")
            # Wait for 90 seconds before fetching the next snapshot
            time.sleep(90)

    def execute(self, message, attachment_actions, activity):

        # Fetch parking data
        parkings = self.fetch_parking_data()
        image_url = self.image_url  # Get the most recent snapshot URL

        facts = []  # Initialize an empty list to hold the Fact objects
        for parking in parkings:
            id = "Parking Bay " + parking["id"]
            status = (
                "🚫 Unavailable, since "
                if parking["Description"] == "Occupied"
                else "✅ Available, since "
            )
            timestamp = datetime.datetime.fromtimestamp(
                parking["Since"]["_seconds"], pytz.timezone("Europe/Brussels")
            )
            timestamp_str = timestamp.strftime("%d/%m/%y %H:%M")
            # Create a new Fact object and add it to the list
            facts.append(Fact(id, status + timestamp_str).__dict__)

        # Create blocks for the Adaptive Card
        title_block = TextBlock(
            "Diegem EV Charging 🔌 - Overview", size="Medium", weight="******"
        ).__dict__
        image_block = Image(image_url).__dict__
        text_block = TextBlock(
            "👋 **Hello and welcome to the Diegem EV Charging System (Beta)!**\n\nThis system lets you track **available parking spots** in real-time. \nIf system load permits, a live 📸 of the parking area will be visible above.\n\nIn case of high traffic, only 🤖 **machine learning analytics** (updated every 5⏱️ minutes) will be presented below.\n\n**Current parking availability** is detailed below:",
            wrap=True,
        ).__dict__
        fact_set_block = {"type": "FactSet", "facts": facts}
        powered_by_block = TextBlock(
            "Powered by ************",
            wrap=True,
            horizontalAlignment="Right",
             size="Small",
            color="Good",
        ).__dict__

        # Create the Adaptive Card
        card = {
            "type": "AdaptiveCard",
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.2",
            "body": [
                title_block,
                image_block,
                text_block,
                fact_set_block,
                powered_by_block,
            ],
        }

        # Message returned will be sent back to the user by bot
        response = Response()
        response.text = "Your Device does not support adaptive cards, raw info:" + str( parkings)
        response.attachments = {
            "contentType": "application/vnd.microsoft.card.adaptive",
            "content": card,
        }
        return response

# Registed custom command with the bot:
bot.add_command(ParkingStatus())

# Connect to Webex & start bot listener:
bot.run()