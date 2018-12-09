const express=require('express');
const bodyParser=require('body-parser');
const hbs=require('hbs');
const mongooose=require('mongoose');
const speakeasy = require("speakeasy");
var QRCode = require('qrcode');
const app=express();
mongooose.connect('mongodb://localhost:27017/userdb')
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine','hbs');

const schema=mongooose.Schema;
let data=new schema({
    userId:{
        type:String,
        default:'',
    },
    password:{
        type:String,
        default:''
    },
    secret:{
        type:Object,
        default:{}
    }
})
const model=mongooose.model('user',data);

app.get('/',(req,res)=>{
        res.render('home.hbs');
})
app.post('/login',(req,res)=>{
    res.render('login.hbs');
})
app.post('/signup',(req,res)=>{
    if(req.body.emailId && req.body.password){
        model.find({userId:req.body.emailId},(err,result)=>{
            if(err){
                res.send({status:505,error:true,message:'error occured',data:null});

            }else if(result === null || result === undefined || result.length === 0){
                var secret = speakeasy.generateSecret({length: 20});
                let data=new model({
                    userId:req.body.emailId,
                    password:req.body.password,
                    secret:secret
                })
                data.save((err,result)=>{
                    if(err){
                        res.send({status:505,error:true,message:'error occured',data:null});
                    }else{
                        res.render('signup.hbs',{status:'account is created'}); 
                    }
                })
            }
            else{
                res.render('signup.hbs',{
                    status:'email-Id is already registered.'
                });
            }
        })
    }else{
    res.render('signup.hbs');
    }
})
app.post('/scancode',(req,res)=>{
    if(req.body.emailId && req.body.password){
        model.find({$and:[{userId:req.body.emailId,password:req.body.password}]},(err,result)=>{
            if(err){
                res.send({status:505,error:true,message:'error occured',data:null});
            }else if(result === null || result === undefined || result.length === 0){
                console.log(result);
                res.render('login.hbs',{status:'Invalid login details'})
            }
            else{
                console.log(result)
                QRCode.toDataURL(result[0].secret.otpauth_url, function(err, image) {
                    if(err){
                        res.send({status:505,error:true,message:'error occured',data:null});
                    }
                    else{
                        res.render('scancode.hbs',{
                            emailId:req.body.emailId,
                            image:image
                        });
                    }
                  });               
            }
        })
    }else{
    res.render('login.hbs');
    }
 
})
app.post('/verify',(req,res)=>{
        if(req.body.emailId && req.body.token){
    model.find({userId:req.body.emailId},(err,result)=>{
        if(err){
            res.send({status:505,error:true,message:'error occured',data:null});
        }
        else if(result === null || result === undefined || result.length === 0){
                  res.render('login.hbs',{status:'Invalid login details'})
        }
        else{
            var verify = speakeasy.totp.verify({
                secret: result[0].secret.base32,
                encoding: 'base32',
                token: req.body.token
              });
              if(verify){
                res.render('verify.hbs',{
                    status:'Login Successful'
                });
              }else{
                res.render('verify.hbs',{
                    status:'Login Failed'
                });
              }
        }
    })
    }else{
        res.render('scancode.hbs',{status:'some error occured'})
    }
})
app.listen(3000);