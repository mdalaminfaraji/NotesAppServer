const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const port = process.env.PORT || 5000;
 
// middleware
app.use(cors());
app.use(express.json());

// verifyJWT

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ error: true, message: 'unauthorized access' })
      }
      req.decoded = decoded;
      next();
    })
  }

  //mongoDb

  const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wu2rnap.mongodb.net/?retryWrites=true&w=majority`;
  
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
    //   await client.connect();
      const usersCollection=client.db('NotesApp').collection('users');
      const AddNoteCollection=client.db('NotesApp').collection('allNote');

      app.post('/jwt', (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  
        res.send({ token })
      })
//user Related Data
app.post('/users', async (req, res) => {
    const user = req.body;
    const query = { email: user.email }
    const existingUser = await usersCollection.findOne(query);
 
    if (existingUser) {
      return res.send({ message: 'user already exists' })
    }

    const result = await usersCollection.insertOne(user);
    res.send(result);
  });
  app.get('/getNote/:email',verifyJWT, async(req, res)=>{
       const {email}=req.params;
        const result=await AddNoteCollection.find({email}).toArray();
        res.send(result);
  }) 
 
        app.post('/addNote', async(req, res)=>{
            const NoteData=req.body;
            const result=await AddNoteCollection.insertOne(NoteData);
            res.send(result);
        })
        app.put('/update/:id', async(req, res)=>{
            const id=req.params.id;
            console.log(id);
            const filter={_id: new ObjectId(id)};
            const option={upsert:true};
            const updateNote=req.body;
            const Note={
                $set:{
                    title:updateNote.title,
                    content:updateNote.content,
                    category:updateNote.category,
                    photoLink:updateNote.photoLink,
                    
                }
            };
            const result=await AddNoteCollection.updateOne(filter, Note, option);
            res.send(result);
    
        })

        app.delete('/addNoteDelete/:id', async(req, res)=>{
            const id=req.params.id;
            console.log(id);
            const query={_id: new ObjectId(id)};
            const result= await AddNoteCollection.deleteOne(query);
            res.send(result);
        })
       app.get('/search',verifyJWT, async(req, res)=>{
        const {query}=req.query;
       
        const regexQuery = new RegExp(query, 'i'); 
        const result = await AddNoteCollection.find({
            $or: [{ title: regexQuery }, { category: regexQuery }],
          }).toArray();
          res.send(result);
       })
        


      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
  
