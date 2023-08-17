const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// ================= middleware =====================
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zjphxo3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client.db("chemistryCorner").collection("users");
    const loveStoriesCollection = client
      .db("chemistryCorner")
      .collection("loveStories");
    const membersCollection = client
      .db("chemistryCorner")
      .collection("members");

    // ==============users db create====================
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send("user already exists");
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // ===========update a user profile===============
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const userInfo = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: userInfo,
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // ==============Get user===============
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // ================= love stories get================
    app.get("/loveStories", async (req, res) => {
      const result = await loveStoriesCollection.find().toArray();
      res.send(result);
    });

    const indexKeys = { name: 1 };
    const indexOptions = { name: "userName" };
    const result = await membersCollection.createIndex(indexKeys, indexOptions);
    app.get("/membersSearchByName/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await membersCollection
        .find({
          $or: [{ name: { $regex: searchText, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    app.get("/members", async (req, res) => {
      let query = {};
      const gender = req.query.gender;
      if (req.query.gender) {
        query = {
          gender: gender,
        };
      }
      const options = {
        projection: {
          _id: 1,
          photo: 1,
          name: 1,
          age: 1,
          location: 1,
          bio: 1,
        },
      };
      const result = await membersCollection.find(query, options).toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("chemistry corner test runing");
});

app.listen(port, () => {
  console.log(`chemistry corner is runing on port ${port}`);
});
