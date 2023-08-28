const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// ================= middleware =====================
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const notesCollection = client.db("chemistryCorner").collection("notes");
    const newsletterCollection = client
      .db("chemistryCorner")
      .collection("newsletter");

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

    // =========index for search by name in members==========
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

    // ==========index for search by locations=========
    const result2 = await membersCollection.createIndex(
      { location: 1 },
      { location: "userLocation" }
    );
    app.get("/membersSearchByLocation/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await membersCollection
        .find({
          $or: [{ location: { $regex: searchText, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    // =============index for complex search  (simanto 1)============== 
    const result3 = await membersCollection.createIndex(
      { age: 1 },
      { age: "age" }
    );
    const result4 = await membersCollection.createIndex(
      { gender: 1 },
      { gender: "gender" }
    );
    app.get("/find-your-partner", async (req, res) => {
      let query = {};
      const gender = req.query.gender;
      const minAge = parseInt(req.query.minAge);
      const maxAge = parseInt(req.query.maxAge);
      const location = req.query.location;
      if (req.query.gender) {
        query.gender = gender;
      }
      if (req.query.minAge && req.query.maxAge) {
        query.age = { $gte: minAge, $lte: maxAge };
      }
      if (req.query.location) {
        query.location = location;
      }
      const result = await membersCollection.find(query).toArray();
      res.send(result);
    });

    // ========get members api============
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

    // ======== get single member api =============

    app.get("/member/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await membersCollection.findOne(query);
      res.send(result);
    });

    app.post("/contact-us", async (req, res) => {
      const contactInfo = req.body;
      const result = await notesCollection.insertOne(contactInfo);
      res.send(result);
    });
    // ======== get and post newsletter api =============
    app.post("/newsletter", async (req, res) => {
      const newsletter = req.body;
      const result = await newsletterCollection.insertOne(newsletter);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB ✅");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("chemistry corner is running");
});

app.listen(port, () => {
  console.log(`chemistry corner is running on port ☣️ ${port}`);
});
