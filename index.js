const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const monk = require('monk');
const yup = require('yup');
const { nanoid } = require('nanoid');

// invoking the express app
const app = express();

// initializing the mongodb
const db = monk(process.env.MONGO_URI || 'localhost:127.0.0.1:27017');
const urls = db.get('urls');
urls.createIndex({ slug: 1}, { unique: true });

// invoking middleware
app.use(helmet());
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5001;

// creating yu schema for validation
const schema = yup.object().shape({
  slug: yup.string().trim().matches(/[\w\-]/),
  data: yup.object(),
});

app.get('/', (req, res) => {
  res.json({
    msg: `App is listening to ${port}`
  })
});

app.post('/', async (req, res, next) => {
  let { slug, json } = req.body;
  try {
    await schema.validate({
      slug,
      json
    });
    !slug ? slug = nanoid() : slug = slug;
    slug = slug.toLowerCase();
    const api = {
      slug, 
      json,
    };
    await urls.insert(api)
    res.json({
      code:1,
      msg: `Insert Complete`
    })
  } catch (error) {
    next(error)
  }
})

app.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const data = await urls.findOne({ slug: id });
    if(data) {
      res.json(data.json);
    } else{
      throw new Error('Url not found');
    }
  } catch (error) {
    next(error);
  }
})


// error handler
app.use((error, req, res, next) => {
  error.status ? res.status = error.status : res.status = error.status = 500;
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? 'Stacking errors' : error.stack
  });
})


app.listen(port);
