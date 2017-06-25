var delay;
var biquadFilter;
var distortion;
var songsLoadedIndex = 0;

var reverb;
var flanger;
var filter;

var activeSongIndex = 0;

var totalSongs = 2;

var audioContext;

var sadnessLerp = 0;
var angryLerp = 0;
var laughLerp = 0;
var surpriseLerp = 0;

var soundLoaded = false;

var songs = [];

var waitingForPlay = false;
      
var acousticGuitar = new Pizzicato.Sound('assets/audio/virus1.txt', function() {

	distortion = new Pizzicato.Effects.Distortion({
    gain: 0.0
});

filter = new Pizzicato.Effects.HighPassFilter({
    frequency: 0,
    
    
});

reverb = new Pizzicato.Effects.Reverb({
    time: 1,
    decay: 0.8,
    reverse: true,
    mix: 0.0
});



//
//acousticGuitar.addEffect(distortion);
acousticGuitar.addEffect(filter);
acousticGuitar.addEffect(reverb);


acousticGuitar.play();

//acousticGuitar.sourceNode.onended = nextSong;

soundLoaded = true;

activeSongIndex = 0;
songsLoadedIndex = 1;
songs.push(acousticGuitar);
loadNextSong();

});          
            


function loadNextSong()
{
	
	var next = new Pizzicato.Sound('assets/audio/virus'+(activeSongIndex+1)+'.txt', function() {
		
		
		songs.push(next);
		console.log(activeSongIndex+1+' loaded');
		songsLoadedIndex++;
		next.addEffect(filter);
		next.addEffect(reverb);
		
		if(waitingForPlay){
			next.play();
			waitingForPlay = false;
		}
		if(songsLoadedIndex < totalSongs)
			loadNextSong();
	});
	
}

function nextSong(){
	console.log("next song called");
	console.log("storedSongs: "+songs.length);
	//var cur = songs.indexOf(currentSong);
	songs[activeSongIndex].stop();

	
	console.log(activeSongIndex+1);
	
	var nextSong = songs[(activeSongIndex+1)%totalSongs];
	if(nextSong != null)
	{
		nextSong.play();
		activeSongIndex=(activeSongIndex+1)%totalSongs;
		waitingForPlay = false;
	}
	else{
		waitingForPlay = true;
	}
	

	/*nextSong.sourceNode.onended = function() {
			  nextSong(nextSong);
			}*/

}


            
           
function createEmojiParticle(emotion)
{
	
    var path = "";
    
    this.image = images.get(emotion);
    
    //Random position on the canvas
	this.x = W+30;
	this.y = Math.random()*(H-40)+20;

	
	//Lets add random velocity to each particle
	this.vx = 0.3;
	//this.vy = (Math.random()-1) * 0.4;
	this.vy = 0;
	
	this.ax = (Math.random()-1)*0.2-0.1;
	this.ay = 0;
    
}


var particles = [];


function addParticle(emotion)
	{
		if(Math.random() > 0.6)
			{
		
				if(particles.length < maxParticles)
				{
					particles.push(new createEmojiParticle(emotion));
				}
				else
				{
					for(var p = 0; p < particles.length; p++)
					{
						if(particles[p].x < -20)
						{
							particles.splice(p,1);
							particles.push(new createEmojiParticle(emotion));
							break;
						}
					}
					
				}
				
				
			}
		
	}

var detector;


function lerp(cur, tar) {
// update position by 20% of the distance between position and target position
  cur += (tar -cur)*0.2;
  return cur;
  
}

$(document).ready( function () {
    
 
    
  var button = document.getElementById("nextSong");
	button.addEventListener('click', function() {nextSong();}, false);
	
	


    /*
	   SDK Needs to create video and canvas nodes in the DOM in order to function
	   Here we are adding those nodes a predefined div.
	*/
	var divRoot = $("#cameraFeed")[0]; 
	
	// The captured frame's width in pixels
	var width = 320;
	
	// The captured frame's height in pixels
	var height = 280;
	
	/*
	   Face detector configuration - If not specified, defaults to 
	   affdex.FaceDetectorMode.LARGE_FACES
	   affdex.FaceDetectorMode.LARGE_FACES=Faces occupying large portions of the frame
	   affdex.FaceDetectorMode.SMALL_FACES=Faces occupying small portions of the frame
	*/
	var faceMode = affdex.FaceDetectorMode.LARGE_FACES;
	
	//Construct a CameraDetector and specify the image width / height and face detector mode.
	detector = new affdex.CameraDetector(divRoot, width, height, faceMode);
	
	
		/* 
	  onImageResults success is called when a frame is processed successfully and receives 3 parameters:
	  - Faces: Dictionary of faces in the frame keyed by the face id.
	           For each face id, the values of detected emotions, expressions, appearane metrics 
	           and coordinates of the feature points
	  - image: An imageData object containing the pixel values for the processed frame.
	  - timestamp: The timestamp of the captured image in seconds.
	*/
	detector.addEventListener("onImageResultsSuccess", function (faces, image, timestamp) {
		if(faces.length > 0){
			
			
				takeSnapshot();
			
			for(var face = 0; face < faces.length; face++){
				var emos = faces[face].emotions;
				var emojis = faces[face].emojis;

				if(emos.joy > 80)
				{
				    addParticle("lol");
				    
				}
				if(emos.sadness > 80)
				{
				    addParticle("sad");
				}
				if(emos.contempt > 80)
				{
				    addParticle("like");
				}
				
				if(emos.surprise > 80)
				{
				    addParticle("wow");
				}
				 if(emojis.kissing > 50)
				{
				    addParticle("heart");
				}
				if(emos.anger > 60)
				{
					addParticle("angry");
					
					
					
				}
				sadnessLerp = lerp(sadnessLerp,emos.sadness);
				angryLerp = lerp(angryLerp,emos.anger);
				laughLerp = lerp(laughLerp, emos.joy);
				
				surpriseLerp = lerp(surpriseLerp, emos.surprise);
				
				
				
			
			}
			
		
			
			
		}
		
		else{
			sadnessLerp = lerp(sadnessLerp, 0);
			angryLerp = lerp(angryLerp,0);
			laughLerp = lerp(laughLerp, 11);
			surpriseLerp = lerp(surpriseLerp, 0);
			
			
		}
		
		if(soundLoaded){
			filter.frequency = laughLerp*50;
			reverb.mix = sadnessLerp/100;
			//flanger.mix = surpriseLerp/100;
			//distortion.gain = angryLerp/100;
		}
		
	
	
    
    //$("#customCanvas").css("background","black");
		
	});
	
	/* 
	  onImageResults success receives 3 parameters:
	  - image: An imageData object containing the pixel values for the processed frame.
	  - timestamp: An imageData object contain the pixel values for the processed frame.
	  - err_detail: A string contains the encountered exception.
	*/
	detector.addEventListener("onImageResultsFailure", function (image, timestamp, err_detail) {
		console.log("ERROR: "+err_detail);
	});
	
	detector.addEventListener("onWebcamConnectSuccess", function() {
	    $("#face_video").css("display", "none");
	    $("#face_video_canvas").css("display", "block");
	    $("#face_video_canvas").css("width", "100%");
	    $("#face_video_canvas").css("height", "100%");
	    $('#cameraFeed').css("display", "block");
	    
	    
	    
		canny = $("#particles")[0];
		ctx = canny.getContext("2d");   
		var wh = canny.getBoundingClientRect();
		W = wh.width;
		H = wh.height;
		canny.width = wh.width;
		canny.height = wh.height;
		ctx.imageSmoothingEnabled = true;
		
		
		
		
		
		   
		console.log("I was able to connect to the camera successfully.");
	});
	
	detector.addEventListener("onWebcamConnectFailure", function() {
		console.log("I've failed to connect to the camera :(");
	});
	
    
	//detector.detectAllAppearance();
	detector.detectExpressions.lipPucker = true;
	detector.detectEmotions.sadness = true;
	detector.detectEmotions.contempt = true;
	detector.detectEmotions.surprise = true;
	detector.detectEmotions.anger = true;
	detector.detectEmotions.joy = true;

	detector.start();

	






        
        
        
    
    
});

var avaImg;

function takeSnapshot(){
	if(avaImg == null)
	{
		avaImg = document.getElementById("face_video_canvas").toDataURL('png');
		//console.log(avaImg.src);
		$( ".avatar-them" ).attr("src", avaImg);
		$( ".avatar-them" ).css("background", '"'+avaImg+'"');
	}
	
	
		
		//var avatars = document.getElementsByClassName("avatar-them");
		/*avatars.forEach(function(element, index, array) {
		
			element.src = avaImg;
		});*/
		//avatar.attr("src", avaImg);
	
}

$(window).bind('beforeunload', function(){
  detector.stop();
});


var maxParticles = 25;
//Canvas dimensions
var W; var H;
var canny; 
var ctx;



//Lets animate the particle
function draw()
{
	//Moving this BG paint code insde draw() will help remove the trail
	//of the particle
	//Lets paint the canvas black
	//But the BG paint shouldn't blend with the previous frame

	if (ctx != null)
	{
		
		//W = canny.width;
		//H = canny.height;
		//console.log("width:"+W);
		//console.log("height:"+H);
    	//ctx.globalCompositeOperation = "source-over";
    	//Lets reduce the opacity of the BG paint to give the final touch
    	//ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    	//ctx.fillRect(0, 0, W, H);
    	ctx.clearRect(0,0,W+30,H+30);
    	
    	//Lets blend the particle with the BG
    	//ctx.globalCompositeOperation = "lighter";
    	
    	//Lets draw particles from the array now
    	for(var t = 0; t < particles.length; t++)
    	{
    		var p = particles[t];
    		
    		ctx.drawImage(p.image, p.x, p.y, 20, 20);
    		
    		//Lets use the velocity now
    		p.vx += p.ax;
    		p.vy += p.ay;
    		p.x += p.vx;
    		p.y += p.vy;
    		
    		//To prevent the balls from moving out of the canvas
    		/*if(p.x < -10)
    		{
    			particles.splice(t,1);
    			
    			console.log("particle popped: "+particles.length);
    		}*/
    	
    		
    		
    	}
    	
    	
    	
	}
}

setInterval(draw, 33);

function ImageCollection(list, callback){
    var total = 0, images = {};   //private :)
    for(var i = 0; i < list.length; i++){
        var img = new Image();
        images[list[i].name] = img;
        img.onload = function(){
            total++;
            if(total == list.length){
                callback && callback();
            }
        };
        img.src = list[i].url;
    }
    this.get = function(name){
        return images[name] || (function(){throw "Not exist"})();
    };
}

//Create an ImageCollection to load and store my images
var images = new ImageCollection([{
    name: "angry", url: "/assets/img/angry.png"},
    {
    name: "sad", url: "/assets/img/sad.png"
    },
    {
    name: "heart", url: "/assets/img/heart.png"
    },
    {
    name: "lol", url: "/assets/img/lol.png"
    },
    {
    name: "wow", url: "/assets/img/wow.png"
    },
    {
    name: "like", url: "/assets/img/like.png"
    }
    
    
]);




var timerID;
$(window).on("resize", function() {
  clearTimeout(timerID);
  timerID = setTimeout(function() {
    canny = $("#particles")[0];                  // cache canvas element
    var rect = canny.getBoundingClientRect();   // actual size of canvas el. itself
    
	ctx = canny.getContext("2d"); 
	console.log($("#face_video").width());
    W = rect.width;
    H = rect.height;
    canny.width = rect.width;
    canny.height = rect.height;
    // ... redraw content here ...
  }, 180);  // adjust at will
});