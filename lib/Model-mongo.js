var Model = require('mise-model');
var mongodb = require('mongo-wrapper');

module.exports = function(name,schema,collectionName,dbConfig){
  mongodb.setup(dbConfig);
  var db = mongodb.db;
  db.add(collectionName);
  var collection = db[collectionName];
  var MongoModel = new Model(name,schema,collectionName);

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

  MongoModel.prototype.update = function(callback){
    // null out _id, as we don't want to update with it.
    var id = this._id;
    if(this._id) delete this._id;
    collection.findAndModifyById(id,null,{$set:this.toObject()},{new:true},respond.bind(null,callback,null));
  };

  MongoModel.prototype.create = function(callback){
    collection.insert(this.toObject,respond.bind(null,callback,'first'));
  };

  MongoModel.prototype.delete = function(callback){
    var _id = parseId(this._id);
    collection.remove({_id : _id},respond.bind(null,callback,'raw'));
  };

  return MongoModel;
};
