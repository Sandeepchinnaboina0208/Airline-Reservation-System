const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use(cors());


const client = new MongoClient('mongodb+srv://admin:admin@cluster0.rzddyty.mongodb.net/?retryWrites=true&w=majority');
client.connect();
const db = client.db('s31');
const col = db.collection('registerhack');
const col1 = db.collection('infohack');
const col2 = db.collection('orderinfo');


app.post("/order", async (req, res) => {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_SECRET
        });

        if (!req.body) {
            return res.status(400).send("Bad Request");
        }

        const options = req.body;

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(400).send("Bad Request");
        }

        res.json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Validate route
app.post("/validate", async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);

        const digest = sha.digest("hex");

        if (digest !== razorpay_signature) {
            return res.status(400).json({ msg: "Transaction is not legit!" });
        }

        res.json({ msg: "Transaction is legit!", orderId: razorpay_order_id, paymentId: razorpay_payment_id });
    } catch (error) {
        console.error("Error validating payment:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).send("Internal Server Error");
});

app.post('/insert', (req, res) => {
    if (req.body.name == null) {
        res.send("fail");
    } else {
        console.log(req.body);
        col.insertOne(req.body);
        res.send("received data");
    }
});


app.post('/coninsert', async (req, res) => {
    console.log(req.body);
    const { desname1, ariname1, date1 } = req.body;

    try {
        const existingFlights = await col1.find({
            $and: [
                { "date": date1 },
                { "desname": desname1 },
                { "ariname": ariname1 }
            ]
        }).toArray();
        console.log(existingFlights)
        if (existingFlights.length > 0) {
            // There are flights available for the specified date and cities
            // You can process the existing flights or send them as a response
            res.send(existingFlights);
        } else {
            // No flights available for the specified date and cities
            res.json({ success: false, message: "No available flights for the specified date and cities." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.get('/show',async(req,res)=>{
    var result = await col1.find().toArray();
    res.send(result);
})
app.get('/show1',async(req,res)=>{
    var result = await col2.find().toArray();
    res.send(result);
})

app.delete('/delete', async (req, res) => {
    console.log(req.query.name);

    try {
        const result = await col1.deleteOne({ "num": req.query.name });

        if (result.deletedCount === 1) {
            res.send("Deleted successfully");
            console.log("done");
        } else {
            res.send("No matching document found");
            console.log("no");

        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});



app.post('/admininsert', (req, res) => {
    if (req.body.desname == null) {
        res.send("fail");
    } else {
        console.log(req.body);
        col1.insertOne(req.body);
        res.send("received data");
    }
});

app.post('/check', async (req, res) => {
    try {
        const result = await col.findOne({ "name": req.body.un });

        if (result == null) {
            res.send("user not available");
        }
        if(req.body.un=="krishna"){
            res.send("ADMIN");
        } 
        else if (result.password == req.body.pw) {
                    res.send("PASS");
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/updatepassword', async (req, res) => {
    try {
        const { un, pw, newPw } = req.body;

        const user = await col.findOne({ "name": un, "password": pw });

        if (user) {
            await col.updateOne({ "name": un }, { $set: { "password": newPw } });
            res.send("done");
        } else {
            res.send("User not found or incorrect current password");
        }
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.post('/insertcustomerdata', (req, res) => {
    console.log(req.body);
    if (!req.body.fname) {
        res.send("fail");
    } else {
        console.log(req.body);
        col2.insertOne(req.body);
        res.send("received data");
    }
});



app.listen(8082, () => {
    console.log('Server running on http://localhost:8082');
});