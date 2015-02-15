# Model-mongo
A Mise Model extension for interfacing with mongodb

Usage:
---

First, create your models using [mise](https://github.com/misejs/mise). You can pass any [Model](https://github.com/misejs/Model) to the constructor returned from this module, and it will add convenience methods for interfacing with mongodb.

For more information on how to use Models with mise, see the mise docs and/or the mise Model docs.

To extend a mise model, first create your model, and in your extension model, require this library. You can add other convenience methods you want, and then use this extended model in your application code.

This extension takes only one additional argument, which is an options hash passed directly to [mongo-wrapper](https://github.com/dmcaulay/mongo-wrapper).

Example:
---

```javascript

var MyModel = require('../lib/models/MyModel.js');
var extend = require('mise-model-mongo');

var ExtendedModel = extend(MyModel,{
  username: 'admin_user',
  password: 'secret',
  hosts: [
    {name: 'primary-1.db.com', port: 27017},
    {name: 'secondary-1.db.com', port: 27017},
    {name: 'secondary-2.db.com', port: 27017}
  ],
  database: 'db_1',
  options: {
    replicaSet: 'replicaset_1',
    readPreference: 'primaryPreferred'
  },
  indexes: {
    users: [
      {index: 'email', options: {unique: true}}
    ]
  }
});

ExtendedModel.prototype.convenienceMethod = function(){
  var data = this.toObject();
  // do something with data.
};

module.exports = ExtendedModel;
```

API
---

This extension adds the following methods:

- Model.all(callback)

  This class method will query the mongodb collection for all of it's entries. The collection is the plural name of the Model, set during original instantiation.

  The callback has the signature `(err,array)`, where array is an array of models of this type.

- Model.one(id,callback)

  This class method will query the mongodb collection for an item with the `_id` of `id`.

  The callback has the signature `(err,model)`, where model is a model of this type with that `_id`.

- Model.prototype.save(callback)

  This instance method will do one of 2 following things, depending on the presence of an id on this model.

  If this instance has an `_id`, it will perform a `findAndModify` query with the data set on this model.

  If this does not have an `_id`, it will perform an `insert` into this model's collection.

  The callback has the signature `(err,model)`, where model is a model of this type (either the updated or created model).

- Model.destroy(id,callback)

  This class method will perform a `remove` query on this collection for an item with the specified id.
  
  The callback has the signature `(err,count)`, where count is the number of removed documents. (Either 1 or 0 in the case of a failure or non-matched `_id`.).

- Model.prototype.destroy(callback)

  This instance method is an alias for the above class method, which will automatically use this instance's `_id`.
