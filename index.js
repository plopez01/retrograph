const express = require('express');
let app = express();
app.use(express.json());

const port = 3000;

let channels = [];

const baseFreq = 930;
const maxFreq = 944;

for (let i = 0; i < maxFreq - baseFreq + 1; i++) {
	channels[i] = [];
}

app.get('/', (req, res) => {
	res.send("Retrograph telegraph routing server at your service ;)");
});

app.get('/channel', (req, res) => {
	if (req.query.frequency == undefined ||
		req.query.frequency < baseFreq || 
		req.query.frequency > maxFreq) return res.status(400).send("Bad frequency.");
		
	let channel = req.query.frequency - baseFreq;
	
	// Channel 0 is a test generator channel
	let frame = []
	if (channel == 0) {
		let date = new Date();
		for (let i = 0; i < req.query.size; i++) {
			frame[i] = ((date.getTime() + i*60) % 1000 > 500) ? 50 : 0;
		}
		console.log("Writing test frame.");
		return res.json(frame)
	} else {
		if (channels[channel].length == 0) return res.send("No data");
		for (let i = 0; i < req.query.size; i++) {
			frame[i] = channels[channel].shift() ?? 0;
		}
	}

	console.log(`[${req.query.frequency}] Downloaded frame of size ${req.query.size} datapoints -> ${channels[channel].length} datapoints total`)
	res.json(frame);
});

app.post('/channel', (req, res) => {
	if (req.query.frequency == undefined ||
        req.query.frequency < baseFreq ||
        req.query.frequency > maxFreq) return res.status(400).send("Bad frequency.");
    let channel = req.query.frequency - baseFreq;
	
	if (channel == 0) return res.status(400).send("No write");

	let sum = 0;
	for (let i = 0; i < req.body.length; i++) {
		sum += req.body[i];
	}
	
	if (sum == 0) {
		console.log(`[${req.query.frequency}] Dropping empty frame.`);
		return res.send("Dropped");
	}

    for (let i = 0; i < req.body.length; i++) {
    	channels[channel].push(req.body[i]);
	}
	
	console.log(`[${req.query.frequency}] Added new frame of size ${req.body.length} -> ${channels[channel].length} datapoints total.`)
	res.send("Ok");
});

app.listen(port, () => {
	console.log(`Telegraph packet router listening on port ${port}`);
})
