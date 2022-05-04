import os
import speech_recognition as sr
# import pyautogui
from pydub import AudioSegment
from os import path
# os.startfile("audio.mp3")
sound = AudioSegment.from_mp3("audio.mp3")
sound.export("audio.wav", format="wav")
os.remove("audio.mp3")
r = sr.Recognizer()
audio = sr.AudioFile("audio.wav")

with audio as source:
    # r.adjust_for_ambient_noise(audio, duration=0.5)
    sample = r.record(audio)
sample_txt = r.recognize_google(sample)
# pyautogui.typewrite(sample_txt)
print(sample_txt)
os.remove("audio.wav")
