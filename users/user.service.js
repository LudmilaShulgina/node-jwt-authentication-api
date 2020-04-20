const config = require('config.json');
const jwt = require('jsonwebtoken');

//DB connection
const mysql = require('mysql2');
const fs = require('fs');

const connection = mysql.createConnection({
    host     : 'rc1a-2nux6pxm9kuj3s3u.mdb.yandexcloud.net',
    port     : 3306,
    user     : 'mechanicalwhale',
    password : 'mechanicalwhale',
    database : 'users',
    ssl  : {
        ca : fs.readFileSync('/home/mechanicalwhale/.mysql/root.crt'),
    }
});

// Connect to server on localhost

connection.connect(function(err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection.threadId);
});



module.exports = {
    authenticate,
    register
};

async function authenticate({ username, password }) {

    const get_info = function(username, password){
        return new Promise(function(resolve, reject){
            connection.query(
                'SELECT * FROM `user` WHERE `username` = ? AND `password` = ?',
                [username, password],
                function(err, rows){
                    if(rows === undefined){
                        reject(new Error("Error rows is undefined"));
                    }else{
                        resolve(rows);
                    }
                }
            )}
    )};

    let response = get_info(username, password)
        .then(function(results){
            let user = results[0];
            if (user) {
                const token = jwt.sign({ sub: user.id }, config.secret);
                const { password, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    token,
                };
            }
        })
        .catch(function(err){
            console.log("Promise rejection error: "+err);
        });

    return response;


}

async function register({ username, password, firstName, lastName }) {

    //Check Forbidden symbols
    const re = /[$"<>#]/g;
    if (username.match(re) !=  null || password.match(re) !=  null || firstName.match(re) !=  null || lastName.match(re) !=  null) {
        let error = "Forbidden symbols";
        return { error }
    }
    else if(!username || !password || !firstName || !lastName){
        let error = "Bad request";
        return { error }
    }
    else {
        const get_info = function(username){
            return new Promise(function(resolve, reject){
                connection.query(
                    'SELECT * FROM `user` WHERE `username` = ?',
                    [username],
                    function(err, rows){
                        if(rows === undefined){
                            reject(new Error("Error rows is undefined"));
                        }else{
                            resolve(rows);
                        }
                    }
                )}
         )};
        const get_info_byID = function(id){
            return new Promise(function(resolve, reject){
                connection.query(
                    'SELECT * FROM `user` WHERE `id` = ?',
                    [id],
                    function(err, rows){
                        if(rows === undefined){
                            reject(new Error("Error rows is undefined"));
                        }else{
                            resolve(rows);
                        }
                    }
                )}
         )};
        const insert_info = function(username, password, firstName, lastName){
            return new Promise(function(resolve, reject){
                connection.query(
                    'INSERT INTO user(username, password, firstName, lastName) VALUES (?,?,?,?) ',
                    [username, password, firstName, lastName],
                    function(err, rows){
                        if(rows === undefined){
                            reject(new Error("Error rows is undefined"));
                        }else{
                            console.log(rows);
                            resolve(rows);
                        }
                    }
                )}
            )};

        //Check duplicate
        let response = get_info(username)
            .then(function(results){
                let user = results[0];
                if (user) {

                    const { password, ...userWithoutPassword } = user;
                    return {
                        ...userWithoutPassword
                    };
                }
            })
            .then(function (user) {
                //Create new user
                if(!user){
                    let newUser = insert_info(username, password, firstName, lastName)
                        .then(function(results){
                            let userId = results.insertId;
                            return  get_info_byID(userId);
                        })
                        .catch(function(err){
                            console.log("Promise rejection error: "+err);
                        });
                    return newUser

                }
                else {
                    return {error:'Such user is already exists'}
                }
            })
            .then(function (user) {
                if(!user.error){
                    const token = jwt.sign({ sub: user[0].id }, config.secret);
                    const { password, ...userWithoutPassword } = user[0];
                    return {
                        ...userWithoutPassword,
                        token,
                    };
                }
                else {
                    return user
                }


            })
            .catch(function(err){
                console.log("Promise rejection error: "+err);
            });

        return response;
    }

}

