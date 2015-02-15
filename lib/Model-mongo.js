var Model = require('mise-model');
var mongodb = require('mongo-wrapper');

module.exports = function(MongoModel,dbConfig){

  var collectionName = MongoModel.prototype.collection;

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
          resp = new MongoModel(item[0]);
          break;
        default :
          resp = new MongoModel(item);
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
  }

  MongoModel.all = function(callback){
    collection.findArray({},respond.bind(null,callback,'array'));
  };

  MongoModel.one = function(id,callback){
    collection.findById(id,respond.bind(null,callback,null));
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

  MongoModel.prototype.destroy = function(callback){
    var _id = parseId(this._id);
    collection.remove({_id : _id},respond.bind(null,callback,'raw'));
  };

  return MongoModel;
};
