const express = require("express");
const mongoose = require("mongoose");
const SSLCommerzPayment = require("sslcommerz-lts");
const app = express();
// const multer = require("multer");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const CONNECTION = process.env.MONGODB_CONNECTION;
const ChatRoute = require("./Routes/ChatRoutes.js");
const MessageRoute = require("./Routes/MessageRoute.js");

// ================= middleware =====================
app.use(cors());
app.use(express.json());

mongoose
  .connect(CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    // Start the Express app after successfully connecting to MongoDB
    // app.listen(port, () => {
    //   console.log(`Listening at Port ${port}`);
    // });
  })
  .catch((error) => {
    console.error(`${error} did not connect`);
  });

app.use("/chat", ChatRoute);
app.use("/message", MessageRoute);

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

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false; //true for live, false for sandbox

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client.db("chemistryCorner").collection("users");
    const loveStoriesCollection = client
      .db("chemistryCorner")
      .collection("loveStories");
    const notesCollection = client.db("chemistryCorner").collection("notes");
    const favoritesCollection = client
      .db("chemistryCorner")
      .collection("favorites");
    const likesCollection = client.db("chemistryCorner").collection("likes");
    const ordersCollection = client.db("chemistryCorner").collection("orders");
    const newsletterCollection = client
      .db("chemistryCorner")
      .collection("newsletter");
    const blogsCollection = client.db("chemistryCorner").collection("blogs");
    const feedbackCollection = client
      .db("chemistryCorner")
      .collection("feedbacks");

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

    // ==========update user role==========
    app.put("/user-role/:id", async (req, res) => {
      const id = req.params.id;
      const role = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: role,
      };
      const result = await usersCollection.updateOne(
        query,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // ========get all users api============
    app.get("/users", async (req, res) => {
      let query = {};
      const gender = req.query.gender;
      if (req.query.gender) {
        query = {
          gender: gender,
        };
      }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // ==============Get user===============
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // ==============delete a user===============
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
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
    const result = await usersCollection.createIndex(indexKeys, indexOptions);
    app.get("/usersSearchByName/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await usersCollection
        .find({
          $or: [{ name: { $regex: searchText, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    // ==========index for search by locations=========
    const result2 = await usersCollection.createIndex(
      { country: 1 },
      { country: "country" }
    );
    app.get("/usersSearchByLocation/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await usersCollection
        .find({
          $or: [{ country: { $regex: searchText, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    // =============index for complex search ==============
    const result3 = await usersCollection.createIndex(
      { age: 1 },
      { age: "age" }
    );
    const result4 = await usersCollection.createIndex(
      { gender: 1 },
      { gender: "gender" }
    );
    app.get("/find-your-partner", async (req, res) => {
      let query = {};
      const gender = req.query.gender;
      const minAge = parseInt(req.query.minAge);
      const maxAge = parseInt(req.query.maxAge);
      const country = req.query.country;
      if (req.query.gender) {
        query.gender = gender;
      }
      if (req.query.minAge && req.query.maxAge) {
        query.age = { $gte: minAge, $lte: maxAge };
      }
      if (req.query.country) {
        query.country = country;
      }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // ======== get single member api =============

    app.get("/member/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // ==========save order in db=================
    app.post("/orders", async (req, res) => {
      const orderInfo = req.body;
      orderInfo.price = parseFloat(req.body.price);
      console.log("orderInfo", orderInfo);
      orderInfo.currency = req.body.currency.toUpperCase();
      const transactionId = new ObjectId().toString();
      const data = {
        total_amount: orderInfo?.price,
        currency: orderInfo.currency,
        tran_id: transactionId, // use unique tran_id for each api call
        success_url: `${process.env.SERVER_API_URL}/payment/success/${transactionId}`,
        fail_url: `${process.env.SERVER_API_URL}/payment/fail/${transactionId}`,
        cancel_url: `${process.env.SERVER_API_URL}/payment/cancel/${transactionId}`,
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: orderInfo.name,
        cus_email: orderInfo.email,
        cus_add1: orderInfo.address,
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: orderInfo.postCode,
        cus_country: "Bangladesh",
        cus_phone: orderInfo.phone,
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        console.log("Redirecting to: ", GatewayPageURL);
        orderInfo.transactionId = transactionId;
        orderInfo.paidStatus = false;
        const result = ordersCollection.insertOne(orderInfo);
      });

      app.post("/payment/success/:tranId", async (req, res) => {
        const result = await ordersCollection.updateOne(
          {
            transactionId: req.params.tranId,
          },
          { $set: { paidStatus: true } }
        );
        if (result.modifiedCount > 0) {
          res.redirect(
            `${process.env.CLIENT_API_URL}/payment/success/${req.params.tranId}`
          );
        }
      });

      app.post("/payment/fail/:tranId", async (req, res) => {
        const result = await ordersCollection.deleteOne({
          transactionId: req.params.tranId,
        });
        if (result.deletedCount) {
          res.redirect(
            `${process.env.CLIENT_API_URL}/payment/fail/${req.params.tranId}`
          );
        }
      });
      app.post("/payment/cancel/:tranId", async (req, res) => {
        const result = await ordersCollection.deleteOne({
          transactionId: req.params.tranId,
        });
        if (result.deletedCount) {
          res.redirect(
            `${process.env.CLIENT_API_URL}/payment/cancel/${req.params.tranId}`
          );
        }
      });
    });

    // ==============get payment =================
    app.get("/payments", async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result);
    });

    // ============get a single payment========
    app.get("/single-payment/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email, paidStatus: true };
      const options = { sort: { orderTime: -1 } };
      const result = await ordersCollection.findOne(query, options);
      res.send(result);
    });

    // ============add to favorite=============
    app.post("/favorites", async (req, res) => {
      const favInfo = req.body;
      const result = await favoritesCollection.insertOne(favInfo);
      res.send(result);
    });

    // ============remove from favorite=============
    app.delete("/favorites/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        userId: id,
      };
      const result = await favoritesCollection.deleteOne(query);
      res.send(result);
    });

    //========get favorite using email=======
    app.get("/favorites", async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (req.query.email) {
        query = { email: email };
      }
      const result = await favoritesCollection.find(query).toArray();
      res.send(result);
    });

    // ==========get favorite list using email=========
    app.get("/favoriteList/:email", async (req, res) => {
      const email = req.params.email;
      const favoriteList = await favoritesCollection
        .find({ email: email })
        .toArray();
      if (!favoriteList) {
        res.send({ message: "favorites not found" });
      }
      const ids = favoriteList.map((item) => item.userId);
      const query = { _id: { $in: ids.map((id) => new ObjectId(id)) } };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // =========likes==========
    app.put("/updateLikes/:id", async (req, res) => {
      const userInfo = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await usersCollection.findOne(query);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.likes) {
        user.likes = 0;
      }
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          likes: parseInt(user.likes) + 1,
        },
      };
      const updatedResult = await usersCollection.updateOne(
        query,
        updatedDoc,
        options
      );
      const insertedResult = await likesCollection.insertOne(userInfo);
      res.send({ updatedResult, insertedResult });
    });

    app.patch("/removeLikes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await usersCollection.findOne(query);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedDoc = {
        $set: {
          likes: parseInt(user.likes) - 1,
        },
      };
      const modifiedResult = await usersCollection.updateOne(query, updatedDoc);
      const deletedResult = await likesCollection.deleteOne({ userId: id });
      res.send({ modifiedResult, deletedResult });
    });

    //========get likes using email=======
    app.get("/likes", async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (req.query.email) {
        query = { email: email };
      }
      const result = await likesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/likesList/:id", async (req, res) => {
      const id = req.params.id;
      const likeList = await likesCollection.find({ userId: id }).toArray();
      if (!likeList) {
        res.send({ message: "likes not found" });
      }
      const emails = likeList.map((item) => item.email);
      const query = {
        email: { $in: emails.map((email) => email) },
      };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // ==========Contact Us==========
    app.post("/contact-us", async (req, res) => {
      const contactInfo = req.body;
      const result = await notesCollection.insertOne(contactInfo);
      res.send(result);
    });

    // ============= contact  us get api=========
    app.get("/contract-get", async (req, res) => {
      const result = await notesCollection.find().toArray();
      res.send(result);
    });

    // ======== get and post newsletter api =============
    app.post("/newsletter", async (req, res) => {
      const newsletter = req.body;
      const result = await newsletterCollection.insertOne(newsletter);
      res.send(result);
    });

    // ======== get and post feedbacks api =============
    app.get("/feedbacks", async (req, res) => {
      const result = await feedbackCollection.find().toArray();
      res.send(result);
    });

    app.post("/feedbacks", async (req, res) => {
      const feedback = req.body;
      const result = await feedbackCollection.insertOne(feedback);
      res.send(result);
    });

    //
    app.post("/blogs", async (req, res) => {
      const blogData = req.body;
      const result = await blogsCollection.insertOne(blogData);
      res.send(result);
    });

    app.get("/blogs", async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    });

    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
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
