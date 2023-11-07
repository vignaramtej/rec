const express = require('express');
const bodyParser = require('body-parser')
const app = express();
const session = require('express-session'); // Import express-session
app.set('view engine','ejs');
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/viewsmentor'));
app.use(express.static(__dirname + '/public'));
const db = require('./db');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const multer = require('multer');
const fs = require('fs');
//student registration
app.post('/stdregistration',(req,res) => {
    let fname = req.body.fname;
    let lname = req.body.lname;
    let email = req.body.email;
    let mobile = req.body.mobile;
    let passwrd = req.body.password;
    let classno = req.body.classno;
    let query = "INSERT INTO students(firstname,lastname,email,mobile,password,class) VALUES('"+fname+"','"+lname+"','"+email+"','"+mobile+"','"+passwrd+"','"+classno+"')";
    db.query(query,(err,result)=>{
        if (!err){
        console.log("Inserted");
        const studentId = result.insertId ; // Assuming result.insertId contains the newly inserted student's ID

        assignRandomMentor(studentId);

        }
        else {
            console.log(err);
        }
    });
   res.send("<h1>Succesfully Registered <br /> <p>Now login </p> </h1>");
});
// Session 
//Common stduent data
app.use(session({
    secret: 'abhi', 
    resave: false,
    saveUninitialized: true,
  }));
app.use((req, res, next) => {
    const studentID = req.session.studentID;
    // Fetch common student data based on the studentID
    const query = 'SELECT Firstname, email, mobile, class FROM students WHERE StudentID = ?';
    db.query(query, [studentID], (err, results) => {
      if (err) {
        console.error('Error fetching common student data:', err);
        return next(err);
      }
      if (results.length > 0) {
        const commonStudentData = results[0];
        res.locals.commonStudentData = commonStudentData; 
        console.log('Common student data:', commonStudentData); 
    }
    const mentID = req.session.mentID;
    const mquery = 'SELECT name, email, mobile  FROM mentors WHERE mentor_id = ?';
    db.query(mquery, [mentID], (err, results) => {
      if (err) {
        console.error('Error fetching common mentor data:', err);
        return next(err);
      }
      if (results.length > 0) {
        const commonMentorData = results[0];
        res.locals.commonMentorData = commonMentorData; 
        console.log('Common mentor data:', commonMentorData); 
    }
      next();
    });
  });
});
/// Dynamically Upload course 

// app.get('/', async (req, res) => {
//     try {
//       const connection = await createConnection();
//       const [rows, fields] = await connection.query('SELECT * FROM courses');
//       await connection.end();
  
//       res.render('index', { courses: rows });
//     } catch (error) {
//       console.error('Error querying courses:', error);
//       res.status(500).send('Internal server error');
//     }
//   });
 
//student login 
app.post('/studentlogin', (req, res) => {
    
    let { Email, Password } = req.body;

    console.log(req.body);
    const query = `SELECT * FROM students WHERE Email = '${Email}' AND Password = '${Password}'`;
    db.query(query,(err, results) => {
        if (err) {
            console.error('MySQL query error:', err);
            return res.status(500).json({ message: 'An error occurred while checking login.' });
          }
        if (results.length === 1) {
        const stdid = results[0].StudentID;
        req.session.studentID = stdid;
        let getquery = `SELECT * FROM students WHERE StudentID = '${stdid}'`;
        db.query(getquery,(err,result)=>{
        console.log(result[0]);      
        if(!err){
            const commonStudentData = res.locals.commonStudentData;

             res.render('profile',{ data: commonStudentData});
             console.log(result[0].Firstname);
        }
        });

      } else {
        // Render an error page with EJS
        res.render('newlogin', { message: 'Invalid email or password' });
      }
    });
  });


//student login 
app.post('/mentorlog', (req, res) => {
    
    let { Email, password } = req.body;

    console.log(req.body);
    const query = `SELECT * FROM mentors WHERE Email = '${Email}' AND password = '${password}'`;
    db.query(query,(err, results) => {
        if (err) {
            console.error('MySQL query error:', err);
            return res.status(500).json({ message: 'An error occurred while checking login.' });
          }
        if (results.length === 1) {
        res.render('./viewsmentor/mentordashboard');
        
        }

        else {
            // Render an error page with EJS
            res.render('./viewsmentor/mentorlogin1', { message: 'Invalid email or password' });
          }
        });

    });

  



 // Random mentor assigning function 
 const assignRandomMentor = (studentId) => {
    // Query the database to get a list of available mentors
    db.query('SELECT * FROM mentors', (error, mentors) => {
      if (error) throw error;
      
      // Randomly select a mentor
      const randomMentor = mentors[Math.floor(Math.random() * mentors.length)];
      
      console.log(randomMentor);

      // Update the student's mentor_id in the database
      db.query('UPDATE students SET mentor_id = ? WHERE StudentID = ?', [randomMentor.mentor_id, studentId], (error, result) => {
        if (error) throw error;
        console.log(`Student with ID ${studentId} assigned to Mentor ID ${randomMentor.mentor_id}`);
      });
    });
};

// Mentor Registration
app.post('/mentorreg', (req, res) => {
    const { name, dob, email, mobile, gender, Occupation, Nationality, state, district, Password } = req.body;
  
    // Check the variable names and their order in the SQL query
    const query = `INSERT INTO mentors (name, password, email, mobile, district, state, dob, gender, Occupation, nationality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
    // Use an array of values to avoid SQL injection
    const values = [name, Password, email, mobile, district, state, dob, gender, Occupation, Nationality];
  
    db.query(query, values, (err, result) => {
      if (!err) {
        console.log("Inserted");
        res.send("<h1>Successfully Registered <br /> <p>Now login </p> </h1>");
      } else {
        console.log(err);
        res.status(500).send("Error registering mentor");
      }
    });
  });
  

 
//Get Requests and Responses
app.get('/login',(req,res) => {
    res.render('newlogin',{message : ''});
})

app.get('/',(req,res) => {
    console.log(req.method);
        res.render('index');
});
app.get('/index',(req,res) => {
    console.log(req.method);
        res.render('index');
});
app.get('/home',(req,res) => {
    console.log(req.method);
    res.render('index');
});
app.get('/profile',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;
    res.render('profile',{ data: commonStudentData });


});


app.get('/dashboard',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('dashboard',{ data: commonStudentData });
});
app.get('/courses',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('courses',{ data: commonStudentData });
});
app.get('/coursevideo',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('coursevideo',{ data: commonStudentData });
});

app.get('/studymaterials',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('studymaterials',{ data: commonStudentData });
});
app.get('/NCERT',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('NCERT',{ data: commonStudentData });
});
app.get('/class12',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('Class12',{ data: commonStudentData });
});
app.get('/math',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('math',{ data: commonStudentData });
});
app.get('/math2',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('math2',{ data: commonStudentData });
});
app.get('/communication',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('communication',{ data: commonStudentData });
});
app.get('/loans',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('loans',{ data: commonStudentData });

});
app.get('/teacherprofile',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;


    res.render('teacherprofile',{ data : commonStudentData });
});
app.get('/help',(req,res) => {
    console.log(req.method);
    const commonStudentData = res.locals.commonStudentData;

    res.render('help',{ data: commonStudentData });
});
app.get('/feedback',(req,res) => {
    console.log(req.method);
    res.render('feedback');
});


//mentor section requests and responses
app.get('/mentordashboard',(req,res) => {
    console.log(req.method);
        res.render('./viewsmentor/mentordashboard');
});
app.get('/mentorlogin',(req,res) => {
    console.log(req.method);
        res.render('./viewsmentor/mentorlogin' , {message:''});
});
app.get('/mentorlogin1',(req,res) => {
    console.log(req.method);
        res.render('./viewsmentor/mentorlogin1',{message: ''});
});
app.get('/mentorupload',(req,res) => {
    console.log(req.method);
        res.render('./viewsmentor/mentorupload');
});
app.get('/success',(req,res) => {
    console.log(req.method);
        res.render('./viewsmentor/success');
});

// app.get('/mentorlogin',(req,res) => {
//     console.log(req.method);
//         res.sendFile(__dirname + '/viewsmentor/mentorlogin');
// });
//Public section
app.get('/public',(req,res) =>
{
    res.render('./public/jobs');

});
//Listening for requests
app.listen(3000,() => {
    console.log("Listening on 3000");
});


