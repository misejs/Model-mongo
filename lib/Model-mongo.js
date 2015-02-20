var mongodb = require('mongo-wrapper');

module.exports = function(Model,dbConfig){

  var MongoModel = Model.subclass();

  var collectionName = MongoModel.prototype.collection;

  MongoModel.idKey = dbConfig.idKey || '_id';

  mongodb.setup(dbConfig);
  var db = mongodb.db;
  db.add(collectionName);
  var collection = db[collectionName];

  var respond = function(callback,type,err,item){
    if(typeof callback === 'function'){
      if(err) return callback(err);
      var resp;
      switch(type){
        case 'array':
          resp = item.map(function(i){
            return new MongoModel(i);
          });
          break;
        case 'raw':
          resp = item;
          break;
        case 'first':
          resp = item[0] ? new MongoModel(item[0]) : null;
          break;
        default :
          resp = item ? new MongoModel(item) : null;
          break;
      }
      callback(null,resp);
    } else if(err){
      throw err;
    }
  };

  var parseId = function(id){
    try {
      return db.id(id);
    } catch(e){
      return null;
    }
  };

  MongoModel.all = function(callback){
    collection.findArray({},respond.bind(null,callback,'array'));
  };

  MongoModel.one = function(id,callback){
    if(typeof id === 'object'){
      // perform a query with an object
      collection.findOne(id,respond.bind(null,callback,null));
    } else {
      // if id is not an object, assume it's an id.
      collection.findById(id,respond.bind(null,callback,null));
    }
  };

  MongoModel.query = function(query,callback){
    collection.findArray(query,respond.bind(null,callback,'array'));
  };

  MongoModel.prototype.save = function(callback){
    var id = this._id;
    // delete _id, as we don't want to update with it.
    var obj = this.toObject();
    delete obj._id;
    if(id){
      collection.findAndModifyById(id,null,{$set:obj},{new:true},respond.bind(null,callback,null));
    } else {
      collection.insert(obj,respond.bind(null,callback,'first'));
    }
  };

  MongoModel.destroy = function(id,callback){
    var _id = parseId(id);
    collection.remove({_id : _id},respond.bind(null,callback,'raw'));
  };

  MongoModel.prototype.destroy = function(callback){
    MongoModel.destroy(this._id,callback);
  };

  return MongoModel;
};
