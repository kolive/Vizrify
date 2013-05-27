        
        /* Variables for Audio Processing Nodes */
        var audioContext;
        var analyser;
        var audioSource;
        var jsNode;
        
        /* Holds frequency data */
        var freqByteData;
        var average;
        var beatRef = 0;
        var runningAverage = 0;
        
        /* Inits Audio Element */ 
        var audio = new Audio();

        /* Used to prevent super fast spawning of actors */
        var timercount = 0;
        var spawntimer = 0;
        
        /* misc */
        var stage, background;
        var bucketCount = 4;
        var circleData = [];
        var pulseData = [];
        var pulseStaleness;
        
        var w = $(window).width() - 200;
        var h = "100%";
        
        var circleIndex = 0;
        
        
        audio.src = getUrlVars()["src"];
        //audio.src = 'test.ogg';
        audio.controls = false;
        audio.autoplay = true;
        document.body.appendChild(audio);
        
        window.addEventListener('load', init, false);
        //window.setInterval(dance, 630);
        
        /*
         *       Inits audio processing. Must be done after page load
         */
        function init(){
        
            //create required nodes
            audioContext = new webkitAudioContext();
            analyser = audioContext.createAnalyser();
            audioSource = audioContext.createMediaElementSource(audio);
            jsNode = audioContext.createJavaScriptNode(1024);
            
            
            //setup analyser
            analyser.smoothingTimeConstant = 0.8;
            //analyser.fftSize = 1024;
        
            //set callback fcn
            jsNode.onaudioprocess = processFFT;
            
            //connect audio source node to analyser
            //and analyser to js processor
            audioSource.connect(analyser);
            analyser.connect(jsNode);
            
            //set source and js nodes to output
            audioSource.connect(audioContext.destination);
            jsNode.connect(audioContext.destination);
            
            stage = setUpStage();
            stage.append("g").attr("id", "fore");
            background = stage.append("g").attr("id", "background");
            stage = stage.select("[id=fore]");
            circleIndex = addNewCircle(0, stage, circleData, circleIndex);
            spawntimer++;
        }

        
        function setUpStage()
        {
            var svg = d3.select("body").select("div").append("svg")
            .attr("width", w+200)
            .attr("height", h);
            
            svg.style("margin-left","auto");
            svg.style("margin-right", "auto");
            svg.style("display", "block");
            svg.style("background-color", d3.rgb(239,234,232));
            d3.select("body").style("background-color", d3.rgb(239,234,232));
            
            return svg;
    
        }
        
        function processFFT(){
       
            var FFTData = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(FFTData);
           
            resizeCircles(FFTData, circleData);
             
            //beat detect
            var currentSense = getAvgSum(FFTData, 4,1)
            if(timercount == 0 && circleIndex >= 4)
            {
                if(beatRef + 1000 < currentSense)
                {
                    pulse();
                    dance();
                }
            }else if(timercount != 0){
                timercount = (timercount+1)%42
            }
            
            if(spawntimer == 0 && circleIndex < bucketCount)
            {
                circleIndex = addNewCircle(0, stage, circleData, circleIndex);
                spawntimer++;
            }else if(spawntimer != 0){
                spawntimer = (spawntimer+1)%84;               
            }
            
            
            
            
            
           
            beatRef = currentSense;
        }
        /*
         *  returns true if the power of the bass passes the beat threshold
         */
        function beatDetect()
        {
            var tmp = getAvgSum(average, 2,0);
            tmp = tmp*tmp*tmp;
            if(timercount == 0)
            {
                console.log("RUNNING AVERAGE: " + runningAverage + " CURRENT INTENSITY: " + tmp);
                timercount++;
            }
            else
                timercount= (timercount+1)%21;
                
            if( tmp - 50000 > runningAverage && timercount==0)
            {
                console.log("WEVE GOT A BEAT!");
                return;
            }
                runningAverage += tmp;
                runningAverage /=2;
                //console.log("Updating Average");
            
           
            
        }
        
        function getAvgSum(array, quantity, range)
        {
           // console.log("BUCKETS: " + array.length/quantity + " STARTING POINT: " + range*(array.length/quantity));
            var tmp = 0;
            var start = Math.floor(range*(array.length/quantity));
            var end = Math.floor((range+1)*(array.length/quantity));
            //console.log("start: " + start + "end: "+ end);
            for(var i = start; i < end; i++)
            {
                tmp += array[i];
            }
          //  console.log(tmp);
            
            return tmp;
        }
        
        
        /*
         * Animates current objects
         */
        function dance()
        {
           var circle = stage.selectAll(".dance");
           circle.transition()
                .duration(630)
                .attr("cx", getNewPosn);
                
           circle.style("fill", getColor);
        }
        
        /*
         * create pulses at current circles
         */
        function pulse()
        {
            var pulse= background.selectAll(".pulse");
            

            if(pulseData.length < 20)
                for(var i = 0; i < circleIndex; i++){
                    if(getSize(circleData[i], i) > 2)
                        pulseData.push(circleData[i]);          
                }
            
            
        
            //allow the new circle to enter stage
            var enter = background.selectAll(".pulse")
                .data(pulseData)
                .enter()
                    .append("circle");

            
          
            enter.attr("cy", "50%");
            enter.attr("cx", function(d, i ) { return stage.selectAll(".dancer"+(i%circleIndex).toString()).attr("cx");});
            enter.attr("r", getSize);
            enter.attr("class", "pulse");
        
            // set circle color
            enter.style("fill", "none");
            enter.style("stroke", "cadetblue");
            enter.style("stroke-width", 2);
            enter.style("stroke-opacity", 0.4);
            
          

            
            enter.transition()
            .duration(2400)
            .style("stoke-opacity", 1e-6)
            .attr("r", 1200).remove();
        }
        
        /*
         * Adds a new circle to the stage
         */
        function addNewCircle(startRad, stage, dataset, index)
        {
            if(spawntimer != 0)
                return;
            
            var circle = stage.selectAll("circle");
            
            //add new data item
            dataset.push(startRad);
            //set circles to new dataset
            circle.data(dataset);            
            
            //allow the new circle to enter stage
            var enter = stage.selectAll("circle")
                .data(dataset)
                .enter()
                    .append("circle");

            //all circles start in the middle
            enter.attr("cy", "50%")
            enter.attr("cx", (w+200)/2);
            enter.attr("r", startRad);
            enter.attr("class", "dance dancer"+ circleIndex.toString());
            
            // set circle color
            enter.style("fill", getColor);
            
            
            return index+1;
            
        }
        
        
        function resizeCircles(FFTData, dataset)
        {
            var tmp = 0;
            for(var i = 1; i < circleIndex+1; i++)
            {
                dataset[i] = getAvgSum(FFTData, bucketCount, i-1) / (FFTData.length/bucketCount);
                tmp += dataset[i];
            }
            if(circleIndex >= bucketCount)
                dataset[0] = tmp/bucketCount;
            else{
                dataset[0] = 0;
                for(var i = 0; i < bucketCount; i++)
                    dataset[0] += getAvgSum(FFTData, bucketCount, i) / (FFTData.length/bucketCount);
                
                dataset[0] /= bucketCount;
            }
            
            var circle = d3.select("body").select("svg").selectAll("circle").data(dataset);
            circle = d3.select("body").select("svg").selectAll("circle")
                .attr("r", getSize);
        }
        /*
         * Given a description and index, returns the size that that actor should be
         */
        function getSize(d, i){
            if(i == 0)
            {
                var tmp = 0;               
                 
                tmp =  200 + (d);
                if ( tmp > 0)
                    return tmp;
                else return 0;
            }
            
            var tmp = 130+d;
            if ( tmp > 0)
                return tmp;
            else return 0;
        }
        
        /*
         * Given the description and index, returns the color that that actor should be
         */
        function getColor(d, i){
            
          if(i == 0)
            return d3.rgb(49,67,64);
          if(i == 1)
            return d3.rgb(73,166,156);
          else if(i == 2)
            return d3.rgb(232,144,99);
          else if(i == 3)
            return d3.rgb(191,86,86);
          else return "tomato";
        }
        
        function getNewPosn(d, i)
        {
            if(i == 0)
                return (w+200)/2;
            else
                return Math.random()*w + 100;
        }
        
        
        function changeSong()
        {
           
            user_input = '';
            for (var i = 0; i < document.forms['changesong'].song.length;i++)
            {
                if(document.forms['changesong'].song[i].checked)
                {
                    user_input = document.forms['changesong'].song[i].value;
                    break;
                }
            }
            
            console.log(audio.src);
            audio.pause();
            window.location = "dc_i5.html?src="+user_input;

        }
        
        function getUrlVars() {
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                vars[key] = value;
            });
            return vars;
        }

        