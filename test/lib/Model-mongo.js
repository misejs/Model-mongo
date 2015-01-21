var assert = require('assert');
var Model = require('../../lib/Model-mongo');
var MiseModel = require('mise-model');
var mongodb = require('mongo-wrapper');

var dbConfig = {
  "hosts": [{
    "name": "localhost",
    "port": 27017
  }],
  "database": "mise-model-mongo-test"
};

describe('Model-mongo',function(){

  var Thing;
  var model;
  var db;

  beforeEach(function(done){
    // load up some fixtures in our DB:
    mongodb.setup(dbConfig);
    db = mongodb.db;
    db.add('things');

    db.things.remove(function(err){
      if(err) throw err;
      db.things.insert([
        {name : 'thing one'},
        {name : 'thing two'},
        {name : 'thing three'},
        {name : 'thing four'}
        ],function(err){
          if(err) throw err;
          done();
        });
    });

    // set up our data
    Thing = new Model('Thing',{
      _id : {
        type : String
      },
      name : {
        type : String
      }
    },'things',dbConfig);
    model = new Thing({name : 'pork'});
  });

  it('should inherit the prototype of mise Model',function(){
    var miseModel = new MiseModel('Thing',{},'things');
    Object.keys(miseModel.prototype).forEach(function(prop){
      assert.ok(Thing.prototype[prop]);
    });
  });

  describe('An instance of Model-mongo',function(){

    it('should query all items when calling .all',function(done){
      Thing.all(function(err,list) {
        assert.ifError(err);
        assert.equal(list.length,4);
        done();
      });
    });

    it('should get a single item by an ID when calling .one',function(done){
      db.things.findOne(function(err,item){
        assert.ifError(err);
        Thing.one(item._id,function(err,found){
          assert.ifError(err);
          assert.deepEqual(new Thing(item),found);
          done();
        });
      });
    });

    it('should return the results of a query when calling .query',function(done){
        Thing.query({name : 'thing four'},function(err,item){
          assert.ifError(err);
          assert.equal(item[0].name,'thing four');
          done();
        });
    });

    it('should save a thing to the db when calling .save with a new item',function(done){
      var newThing = new Thing({name : 'buttbutt'});
      newThing.save(function(err,item){
        assert.ifError(err);
        assert.ok(item._id);
        Thing.all(function(err,list){
          assert.ifError(err);
          assert.equal(list.length,5);
          done();
        });
      });
    });

    it('should update an item when calling .save with an existing item',function(done){
      Thing.query({name : 'thing four'},function(err,list){
        assert.ifError(err);
        var thing = list[0];
        var nu = {name : 'not thing four anymore'};
        thing.name = nu.name;
        thing.save(function(err,saved){
          assert.ifError(err);
          assert.equal(saved.name,nu.name);
          Thing.query(nu,function(err,item){
            assert.ifError(err);
            assert.deepEqual(saved,item[0]);
            done();
          });
        });
      });
    });

    it('should remove an item when calling .destroy',function(done){
      Thing.query({name : 'thing two'},function(err,list){
        assert.ifError(err);
        list[0].destroy(function(err,response){
          assert.ifError(err);
          Thing.query({name : 'thing two'},function(err,items){
            assert.ifError(err);
            assert.equal(items.length,0);
            Thing.all(function(err,items){
              assert.ifError(err);
              assert.equal(items.length,3);
              done();
            });
          });
        });
      });
    });

  });

});
