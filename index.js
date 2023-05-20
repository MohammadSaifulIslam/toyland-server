const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

// midlewire
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kgqetuh.mongodb.net/?retryWrites=true&w=majority`;

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
    client.connect();
    const toyCollection = client.db("toyLand").collection("toys");

    // Creating index on subcategory fields
    const indexKeys = { name: 1 };
    const indexOptions = { name: "name" };
    const result = await toyCollection.createIndex(indexKeys, indexOptions);
    console.log(result);

    // get all toys
    app.get("/all-toys", async (req, res) => {
      const result = await toyCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      res.send(result);
    });

    // get single toy details
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });

    // get toys by subCategory
    app.get("/toys-by-subCategory/:text", async (req, res) => {
      const subCategory = req.params.text;


      const query = { subcategory: subCategory };
      const result = await toyCollection.find(query).toArray();
      return res.send(result);
    });

    // pagination toy toys by subCategory
    app.get("/pagination-by-subCategory/:text/:page", async (req, res) => {
      const subCategory = req.params.text;

      // subcategory pagination
      const page = parseInt(req.params.page) || 1;
      const limit =  4;
      const skip = (page - 1) * limit;

      const query = { subcategory: subCategory };
      const result = await toyCollection.find(query).limit(limit).skip(skip).toArray();
      return res.send(result);
    });


    // search toys by name
    app.get("/toysByName/:searchText", async (req, res) => {
      const searchText = req.params.searchText;

      const query = { name: { $regex: searchText, $options: "i" } };
      const result = await toyCollection.find(query).limit(20).toArray();
      res.send(result);
    });

    // get users toys by email which user added
    app.get("/my-toy", async (req, res) => {
      const email = req.query.email;

      const query = { sellerEmail: email };
      const result = await toyCollection.find(query).toArray();
      res.send(result);
    });

    // add new toy
    app.post("/add-toy", async (req, res) => {
      const toyData = req.body;
      toyData.createdAt = new Date();

      const result = await toyCollection.insertOne(toyData);
      res.send(result);
    });

    // update toy details
    app.patch("/update-toy/:id", async (req, res) => {
      const id = req.params.id;
      const toyDetails = req.body;
      console.log(toyDetails);

      const query = { _id: new ObjectId(id) };
      const updateToy = {
        $set: {
          ...toyDetails,
        },
      };
      const result = await toyCollection.updateOne(query, updateToy);
      res.send(result);
    });

    // toy delete
    app.delete("/delete-toy/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });

    // pagination
    app.get("/totalToys", async (req, res) => {
      const result = await toyCollection.estimatedDocumentCount();
      res.send({ totalToys: result });
    });

    // Send a ping to confirm a successful connection
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
  res.send("Welcome to ToyLand Server");
});

app.listen(port, () => {
  console.log(`ToyLand server is running on port: ${port}`);
});
