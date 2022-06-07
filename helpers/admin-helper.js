
var db= require('../config/connection')
var collection=require('../config/collections')
const { ObjectId } = require('mongodb');
module.exports= {
   
  userStatus: (userData) => {
    let response = {}
    return new Promise(async (resolve, reject) => {
        let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
        if (user) {
            if (user.status == "active") {
                console.log('active user');
                response.status = true
                resolve(response)
            } else {
                console.log('@@@@@@@@@@@@@blocked user');
                response.block = true
                resolve(response)
            }
        }
        else {
            console.log('blocked user');

            resolve({ status: false })
        }
    })


},

   
  addProduct:(product,callback)=>{ 
        // console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>{
      
          callback(data.insertedId)
        })
    },
    
    getAllProduct: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            // console.log(product);
            resolve(product)
        })
    },

     getProductDetails: (productId) => {
      return new Promise((res, rej) => {
          db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(productId) }).then((product) => {
              res(product)
          })
      })
  },
    
    updateProduct: (productId, productDetails) => {
      return new Promise((resolve, reject) => {
          db.get().collection(collection.PRODUCT_COLLECTION)
              .updateOne({ _id: ObjectId(productId)}, {
                  $set:{
                   
                      name:productDetails.name,
                      category:productDetails.category,
                      discription:productDetails.discription,
                      discountedprice:productDetails.discountedprice,
                     
                      price:productDetails.price
                     
              }
              }).then((response)=>{
                // console.log(response)
                  resolve()
              })
      })
  },

  deleteProduct: (productId) => {
    return new Promise((res, rej) => {
        db.get().collection(collection.PRODUCT_COLLECTION).remove({ _id: ObjectId(productId) }).then((response) => {
            res(response)
        })
    })
},
getAllUsers: () => {
  return new Promise(async (resolve, reject) => {
      let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
   
      resolve(users)
  })
},
blockUser:(id)=>{
  return new Promise ((res,rej)=>{
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(id)}, {$set:{status:true,status:false}} ).then((block) => {
          res(block)
      })
  })
},

unblockUser:(id)=>{
  return new Promise ((res,rej)=>{
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(id)}, {$set:{status:false,status:true}} ).then((unblock) => {
          res(unblock)
      })
  })
},


Category:(category,callback)=>{ 
  console.log(category);
  db.get().collection('category').insertOne(category).then((data)=>{

    callback(data.insertedId)
  })
},

getcategoryDetails: (categoryId) => {
  return new Promise((res, rej) => {
      db.get().collection(collection.CATAGORY_COLLECTION).findOne({ _id: ObjectId(categoryId) }).then((category) => {
          res(category)
      })
  })
},

getCategory: () => {
  return new Promise(async (resolve, reject) => {
      let category = await db.get().collection(collection.CATAGORY_COLLECTION).find().toArray()
      // console.log(product);
      resolve(category)
  })
},

deleteCategory: (categoryId) => {
  return new Promise((res, rej) => {
      db.get().collection(collection.CATAGORY_COLLECTION).remove({ _id: ObjectId(categoryId) }).then((response) => {
          res(response)
      })
  })
},
updateCategory: (categoryId, categoryDetails) => {
  console.log(categoryDetails);

  return new Promise((resolve, reject) => {
      db.get().collection(collection.CATAGORY_COLLECTION)
          .updateOne({ _id: ObjectId(categoryId)}, {
              $set:{
               
                  
                  category:categoryDetails.category,
                
                  
                 
          }
          }).then((response)=>{
            // console.log(response)
              resolve()
          })
  })
},


}


