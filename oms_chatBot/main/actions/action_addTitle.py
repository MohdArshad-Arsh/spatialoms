# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions


# This is a simple example for a custom action which utters "Hello World!"

from rasa_sdk import Action
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk import Tracker
from actions.services.conversation import send_and_store


class ActionAddTitle(Action):

    def name(self):
        return "action_add_title"

    def run(self, dispatcher, tracker, domain):

        name = tracker.get_slot("name")

        if name:
            name = name + " khan"
        else:
            name = ""

        response = f"Hello {name}, welcome too!"
        send_and_store(dispatcher, tracker, response)

        return []
