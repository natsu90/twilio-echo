
## Twilio Echo

Chat bot or voice command via phone call.

### Demo

https://www.youtube.com/watch?v=91-_yNYDetY

### Idea

We could use recording feature in Twilio, where we would transcribe the audio file using Google Speech. And then we would send a reply accordingly. Inspired from [VoiceIt and Twilio implementation](https://github.com/choppen5/twilioVoiceItiVR).

### Google Speech

Twilio has their own transcription engine but I think it is not very accurate, and they are charging $0.05/min for it, plus they are only limited to recording with a duration greater than 2 seconds and less than 120 seconds. Where as Google Speech is giving free first 60 minutes per month, and they are only charging $0.006 per 15 seconds.

https://cloud.google.com/speech/pricing

### Twilio

Aside from cost of USA phone number which is $1/month, they are charging $0.0075/min for incoming call, and $0.0025/min for recording.

Noted that they are also charging $0.0005/min/month for recording storage, but they are giving free first 10,000 minutes per month. So you might want to delete the recordings each month.

https://www.twilio.com/voice/pricing/nz

### VoiceIt

If you want to implement voice command, you might want to add voice authentication. Unlike other providers, we can use our own phrase instead of some pre-defined words. And they are giving $5 free credits upon signup.

http://voiceit-tech.com

### Prerequisites

1. Twilio account, duh

2. Google Cloud JSON key file; https://github.com/GoogleCloudPlatform/google-cloud-node#elsewhere

3. API.AI account, for chat bot demo

4. VoiceIt account, for voice authentication demo

### Installation

1. `git clone https://github.com/natsu90/twilio-echo.git`

2. `cd twilio-echo && npm install`

3. Set your `.env` file

3. `node src/chat-demo.js`, or `node src/auth-demo.js` for voice authentication demo

4. Set your Twilio Voice webhook to `your_IP_or_domain:1337/incoming_call`

### Limitations

* Transcription not accurate sometimes, probably due to poor quality of audio, or just my poor pronounciation

* Recording URL from Twilio is not available immediately sometimes

* A little delay between chat and reply, does not matter for voice command app

### Todo

* Delete recording automatically on transcribed chat or ended call

* Implement with Nexmo

### License

Licensed under the [MIT license](http://opensource.org/licenses/MIT)
