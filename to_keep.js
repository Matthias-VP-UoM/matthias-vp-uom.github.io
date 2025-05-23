let pid;
    let order;

    async function generatePID(age, gender,ip_address) {
        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, 'pids/');
            let maxPID = 0;

            listAll(storageRef)
                .then((res) => {
                    // List all directories in this directory, find the one with the largest number as a name
                    res.prefixes.forEach((prefix) => {
                        const number = parseInt(prefix.name);
                        if (number > maxPID) {
                            maxPID = number;
                        }
                    });

                    const thisPID = maxPID + 1;
                    // console.log("MAX PID: " + maxPID);

                    const data = {
                        age: age,
                        gender: gender,
                        ip: ip_address,
                    };

                    const file = new Blob([JSON.stringify(data, null, 2)], {
                        type: 'application/json'
                    });

                    const fileName = 'info' + (thisPID) + '.json';
                    const pidRef   = ref(storage, 'pids/' + (thisPID) + '/');
                    const fileRef  = ref(pidRef, fileName);

                    uploadBytes(fileRef, file)
                        .then(() => {
                            resolve(thisPID); // Resolve with the generated PID
                        })
                        .catch((error) => {
                            reject(error); // Reject the promise if there is an error
                        });
                })
                .catch((error) => {
                    reject(error); // Reject the promise if there is an error listing directories
                });
        });
    }

    function setPID(pid) {
        document.cookie = `pid=${pid}; expires=Thu, 31 Dec 2099 23:59:59 GMT; path=/`;
    }

    function setProgress(progress) {
        document.cookie = `progress=${progress}; expires=Thu, 31 Dec 2099 23:59:59 GMT; path=/`;
    }

    // Cookie to set 1. random set of images from either A or B and 2. the order of those images
    function setRandomisation(progress) {
        if (progress == 0) {
            // group = Math.random() < 0.5 ? 'A' : 'B';
            // Temporary switch to offset imbalance
            // group = 'B';

            // Generate list of number from 1 to 100 and shuffle
            let nums = Array.from({ length: 100 }, (_, i) => i + 1);
            order = nums.sort(() => Math.random() - 0.5);
            // document.cookie = `group=${group}; expires=Thu, 31 Dec 2099 23:59:59 GMT; path=/`;
            document.cookie = `order=${order}; expires=Thu, 31 Dec 2099 23:59:59 GMT; path=/`;
        }
    }

    function getProgress() {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            const [name, value] = cookie.split('=');
            if (name === 'progress') {
                return value;
            }
        }
        return null; // Return null if the progress cookie is not found
    }

    function getPID() {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            const [name, value] = cookie.split('=');
            if (name === 'pid') {
                return value;
            }
        }
        return null; // Return null if the PID cookie is not found
    }
    function getOrder() {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            const [name, value] = cookie.split('=');
            if (name === 'order') {
                // console.log('Order cookie found: ' + value);
                // Convert to list of integers
                return value.split(',').map(Number);
            }
        }
        return null; // Return null if the order cookie is not found
    }

    //let numDots      = 10;
    let game         = document.getElementById("game");
    //let cross        = document.getElementById("cross");
    //let trail        = document.getElementById('trail');
    let bottom       = document.getElementById("bottom");
    let dogame       = document.getElementById("dogame");
    //let slider       = document.getElementById("slider");
    let myRange      = document.getElementById("myRange");
    let thankyou     = document.getElementById("thankyou");
    let disclaimer   = document.getElementById("disclaimer");
    let imgcontainer = document.getElementById("imgcontainer");
    //let dotContainer = document.getElementById("dot-container");
    let originalHoverText = document.getElementById("hovertext").innerHTML;

    //These will hold the image-title pair
    let img;
    let title;

    let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (!isSafari) {
        myRange.style.opacity = 0;
    } else {

    }

    // Create and position 10 dots
    for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot inactive';
        dot.style.left = `${(i * 100) / (numDots - 1)}%`; // Evenly position dots
        

        if (isSafari) {
            dot.style.opacity = 0;
        }

        dotContainer.appendChild(dot);
    }


    function updateDots(value) {
        const dots = document.querySelectorAll('.dot');
        console.log(value);

        if (value == -1) {
            dots.forEach((dot) => {
                dot.classList.remove('active');
                dot.classList.add('inactive');
            });
            return;
        }

        const index = Math.round(value / (100 / (numDots - 1)));
        dots.forEach((dot, i) => {
            if (i <= index) {
                dot.classList.remove('inactive');
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
                dot.classList.add('inactive');
            }
        });
    }

    // MOBILE: Update dots based on slider input
    /*myRange.addEventListener('input', function() {
        updateDots(this.value);
    });

    // Handle mouse movement for precise dot activation
    myRange.addEventListener('mousemove', function(e) {
        const rect = myRange.getBoundingClientRect();
        let offsetX = e.clientX - rect.left;
        
        const value = (offsetX / rect.width) * 100; // Calculate value based on mouse position
        myRange.value = Math.min(Math.max(value, 0), 100);
        updateDots(myRange.value);
    });

    myRange.addEventListener('mouseleave', function() {
        // Check if mouse event are still active
        if (myRange.style.pointerEvents == 'none') {
            return;
        }

        updateDots(-1);
    });*/

    // Initialize dots on page load
    //updateDots(-1);

    // Get titles from titles.txt
    let titles = [];
    fetch('./titles.txt')
        .then(response => response.text())
        .then(text => {
            titles = text.split('\n');
        });

    let imageCount;
    let imgNum;
    let maxCount = 100;

    imageCount = getProgress() == null ? 0 : parseInt(getProgress());
    console.log(imageCount);

    // Track mouse movements
    let mouse = {
        x: 0,
        y: 0
    };

    // List of mouse positions
    let sliderPosition = -1;

    let age;
    let gender;
    let ip_address;

    let formsubmit = document.getElementById("formsubmit");
    let submittext = document.getElementById("submittext");

    // Prevent default on formsubmit
    formsubmit.addEventListener('click', (event) => {
        event.preventDefault();
        submitForm(event);
    });

    start.style.pointerEvents = 'none';
    start.style.opacity = '0.3';

    // Check if #agree is checked, if yes allow START to be clicked, else no
    let agree = document.getElementById("agree");

    agree.addEventListener('change', () => {
        if (agree.checked) {
            start.style.pointerEvents = 'auto';
            start.style.opacity = '1';
        }

        else {
            start.style.pointerEvents = 'none';
            start.style.opacity = '0.3';
        }
    });

    function handleSlider(event) {
        event.preventDefault();

        // Make the last white dot bigger, transform scale
        let dots = document.querySelectorAll('.active');
        dots[dots.length - 1].style.transform = "scale(1.5)";

        //myRange.removeEventListener('click', handleSlider);
        //myRange.removeEventListener('touchend', handleSlider);

        // Prevent all mouse events
        //myRange.style.pointerEvents = 'none';
        

        sliderPosition = myRange.value;
        imageCount++;
        setProgress(imageCount);
        endGame(sliderPosition);
    }

    // Function disclaimer
    function doDisclaimer() {
        console.log("doDisclaimer()")
        disclaimer.style.display = "flex";
        thankyou.style.display = "none";


        // Create button
        let start = document.getElementById("start");
        let text = document.getElementById("disclaimertext");
        let startText = document.getElementById("starttext");

        let cookieProgress = parseInt(getProgress());

        if (cookieProgress == maxCount) {
            startText.innerHTML = "TEST COMPLETE";
            start.style.pointerEvents = 'none';
            start.style.opacity = '0.3';

            let terms = document.getElementById("agreeterms");
            terms.style.display = "none";
        }
        else if (cookieProgress > 0) {
            startText.innerHTML = "CONTINUE";
        }

        // On button hover, change the background color fade into white
        start.addEventListener('mouseenter', () => {
            start.style.backgroundColor = "#181818";
            startText.style.color = "#dfdfdf";
        });

        // On button hover, change the background color fade into white
        start.addEventListener('mouseleave', () => {
            start.style.backgroundColor = "#dfdfdf";
            startText.style.color = "#181818";
        });

        // Add a "click" event listener to the game div
        start.addEventListener('click', () => {
            event.preventDefault();

            // Remove the text
            text.style.display = "none";
            start.style.display = "none";


            // Start the game
            if (getPID() == null) {
                showForm();
            }
            else {
                initialiseGame();
            }
        });
    }

    function handleChange() {
        age = document.getElementById("age").value;
        gender = document.getElementById("gender").value;
        if (age != "" && age >= 16 && age <= 100 && gender != "") {
            formsubmit.style.pointerEvents = 'auto';
            formsubmit.style.opacity = '1';
        } else {
            formsubmit.style.pointerEvents = 'none';
            formsubmit.style.opacity = '0.3';
        }
    }

    function showForm() {
        let genderBox = document.getElementById("gender");

        genderBox.addEventListener('change', () => {
            genderBox.style.color = "#181818";
        });

        // On button hover, change the background color fade into white
        formsubmit.addEventListener('mouseenter', () => {
            formsubmit.style.backgroundColor = "#181818";
            submittext.style.color = "#dfdfdf";
        });

        // On button hover, change the background color fade into white
        formsubmit.addEventListener('mouseleave', () => {
            formsubmit.style.backgroundColor = "#dfdfdf";
            submittext.style.color = "#181818";
        });

        formsubmit.style.opacity = '0.3';
        formsubmit.style.pointerEvents = 'none';

        infoform.addEventListener('change', handleChange);

        let infosubmission = document.getElementById("infosubmission");
        disclaimer.style.display = "none";

        infosubmission.style.display = "flex";
    }

    function submitForm(event) {
        event.preventDefault();

        age = document.getElementById("age").value;

        // Check if values are empty
        if (age == "") {
            alert("Please enter your age.");
            return;
        }

        initialiseGame();
    }

    async function initialiseGame() {
        console.log("initialiseGame()")
        infosubmission.style.display = "none";

        infoform.removeEventListener('change', handleChange);


        if (imageCount == 0 && getPID() == null) {
            try {
                // Generate a new PID and wait for the function to return before continuing
                setRandomisation(imageCount);
                const newPID = await generatePID(age, gender,ip_address);
                console.log("PID:" + newPID);
                setPID(newPID);
                setProgress(imageCount);

                console.log("NEW PID GENERATED: " + newPID + " " + order);

                pid = newPID; // Update pid with the new PID
            } catch (error) {
                console.error("Error generating PID:", error);
                // Handle error (e.g., show an error message to the user)
                return;
            }
        } else {
            pid = getPID();
            order = getOrder();
            imageCount = parseInt(getProgress());

            console.log("CONTINUING PID: " + pid + " " + order);
        }

        // Continue with the game
        doGame();
    }

    // Function game
    function doGame() {

        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)){
            myRange.value = 50;
        }


        myRange.style.pointerEvents = 'auto';

        console.log("doGame()")
        // console.log("STARTING GAME " + imageCount);
        disclaimer.style.display = "none";
        dogame.style.display = "flex";
        trail.style.display = "none";

        thankyou.style.display = "none";

        document.documentElement.style.overflowY = "hidden";

        // Download image and cache
        imgNum = order[imageCount];
        // img.src = './images/' + (imgNum) + '.jpg';
        // img.style.display = "none";
        // imgcontainer.style.display = "none";

        // console.log(img, img.src, document.getElementById("mainimage").src);

        // let dot = document.getElementById("dot");
        // dot.style.display = "block";

        // // Text under the dot to tell the user to hover over it
        // let text = document.getElementById("hovertext");
        // text.style.display = "block";

        // dot.addEventListener('mouseenter', () => {
        //     // Change the user's cursor to a crosshair
        //     dot.style.cursor = "crosshair";
        //     img.style.cursor = "crosshair";

        //     let change2;
        //     let change3;

        //     let seconds1 = 900;
        //     let seconds2 = 1800;
        //     let seconds3 = 2700;

        //     // let seconds1 = 200;
        //     // let seconds2 = 300;
        //     // let seconds3 = 400;

        //     // Start a visual countdown 3 2 1...
        //     text.innerHTML = "3";
        //     change2 = setTimeout(() => {
        //         text.innerHTML = "2";
        //     }, seconds1); // 1000 milliseconds = 1 second

        //     change3 = setTimeout(() => {
        //         text.innerHTML = "1";
        //     }, seconds2); // 2000 milliseconds = 2 seconds

        //     // Set a timer to trigger the game start after 3 seconds.
        //     const timer = setTimeout(() => startGame(), seconds3);

        //     // Start fading out bottom
        //     bottom.style.opacity = 1;
        //     let opacity = 1;
        //     let fadeOut = setInterval(() => {
        //         if (opacity <= 0) {
        //             clearInterval(fadeOut);
        //             bottom.style.display = "none";
        //         }
        //         else {
        //             opacity -= 0.1;
        //             bottom.style.opacity = opacity;
        //         }
        //     }, 100);

        //     // Add a "mouseleave" event listener to cancel the timer if the user moves the cursor away.
        //     dot.addEventListener('mouseleave', () => {
        //         // Cancel all timeouts
        //         clearTimeout(change2);
        //         clearTimeout(change3);
        //         clearTimeout(timer);
        //         text.innerHTML = originalHoverText; // Reset the text

        //         // Reset the opacity of the bottom
        //         bottom.style.opacity = 1;
        //         clearInterval(fadeOut);
        //         bottom.style.display = "block";

        //     });
        // });
        // game.appendChild(dot);

        startGame()

        // Function startGame
        function startGame() {
            //updateDots(-1);
            
            //Remove title and image, if any
            if (typeof img !== 'undefined')
                img.remove()
            if (typeof title !== 'undefined')
                title.remove()
            
            //Create elements for image and headline
            //Order alternates to not add additional bias    
            img = document.createElement('img')
            img.setAttribute('id', 'mainimage');
            title = document.createElement('h1')  
            title.setAttribute('id', 'maintitle');
            

            if (isSafari) {
                // img.style.backgroundColor = 'yellow';
                img.style.height = 'auto';
            }


            let elements = [img,title]
            for (let i = 0; i < elements.length; i++) {
                imgcontainer.insertBefore(elements[(i+imageCount)%2], imgcontainer.firstChild);
            }


            console.log("startGame()")

            bottom.style.display = "none";

            disclaimer.style.display = "none";
            dogame.style.display = "none";

            // Flush trail div
            // trail.innerHTML = "";

            dot.style.display = "none";
            // text.style.display = "none";

            // Create a new image element
            img.src = './images/' + (imgNum) + '.jpg';

            // Set title, get from title.txt at line imgNum - 1
            title.innerHTML = titles[imgNum - 1];

            // Empty the mousePositions array
            // mousePositions = [];

            // Add a mousemove event listener to the game div
            // img.addEventListener('mousemove', handleMouseMove);

            // Add a mouse click event listener to the game div
            // img.addEventListener('click', handleClick);

            // img.addEventListener('mousemove', handleTrails);

            // trail.style.display = "block";
            img.style.display = "block";
            imgcontainer.style.display = "flex";

            // Fade imgcontainer in
            imgcontainer.style.opacity = 0;
            let opacity = 0;

            let fadeIn = setInterval(() => {
                if (opacity >= 1) {
                    clearInterval(fadeIn);
                }
                else {
                    opacity += 0.1;
                    imgcontainer.style.opacity = opacity;
                }
            }, 50);

            // Show the slider
            //slider.style.display = "block";

            // Prevent clicks on slider
            //slider.style.cursor = 'default';

            //myRange.style.cursor = "pointer";
            //myRange.addEventListener('click', handleSlider);
            //myRange.addEventListener('touchend', handleSlider);

            let dots = document.querySelectorAll('.dot');
            dots.forEach((dot) => {
                dot.style.transform = "scale(1)";
                // dot.classList.remove('active');
                // dot.classList.add('inactive');
            });
        }
    }

    // Function endGame
    function endGame(sliderPosition) {
        console.log("endGame()")

        const data = {
            sliderPosition: sliderPosition
        }

        // console.log(data);

        const file = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const jsonData = JSON.stringify(data, null, 2);

        // Save in firebase storage
        const storageRef = ref(storage, 'pids/' + pid + '/slider/' + imgNum + '/');

        // Check number of files already in firebase storage
        listAll(storageRef)
            .then((res) => {
                const fileName = 'slider' + pid + '.json';

                // console.log(res.items.length);
                // console.log(firebaseCounter);

                const fileRef = ref(storageRef, fileName);

                // Upload the file only once inside the listAll callback
                return uploadBytes(fileRef, file);
            })
            .then((snapshot) => {
                console.log('Uploaded a blob or file!');
                console.log(snapshot.ref);
                console.log(snapshot.ref.name);
            })
            .catch((error) => {
                console.error(error);
            });

        // Wait for 2 seconds and call thank You
        setTimeout(() => thankYou(), 500);

    }

    // Function thankYou
    function thankYou() {
        if (imageCount % 5 == 0) {
            // Show a thank you message
            bottom.style.display = "block";

            thankyou.style.display = "flex";

            game.style.pointerEvents = 'auto';

            // Hide the cross
            cross.style.display = "none";

            // Display a thank you message to the user
            let text = document.getElementById("thankyoutext");
            text.style.display = "block";

            // Display a random fact to the user
            let randomfact = document.getElementById("randomfact");
            randomfact.innerHTML = getRandomFact();


            trail.style.display = "none";
            img.style.display = "none";
            imgcontainer.style.display = "none";


            // Create button
            let button = document.getElementById("nextimage");
            let buttonText = document.getElementById("nextimagetext");
            let imagefraction = document.getElementById("imagefraction");


            if (imageCount < maxCount) {
                button.style.display = "flex";
                imagefraction.style.display = "block";

                // Display number of images done over total number of images (maxcount)
                imagefraction.innerHTML = (imageCount) + " / " + maxCount;
            }
            else {
                button.style.display = "none";

                imagefraction.innerHTML = "TEST COMPLETE";
                imagefraction.style.marginTop = "4em";
                imagefraction.style.display = "block";

                return;
            }

            // Check if button already has an event listener, if yes continue
            if (button.hasEventListener) {
                return;
            }

            // On button hover, change the background color fade into white
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = "#181818";
                button.style.color = "#dfdfdf";
            });

            // On button hover, change the background color fade into white
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = "#dfdfdf";
                button.style.color = "#181818";
            });

            // Add a "click" event listener to the game div
            button.addEventListener('click', () => {
                event.preventDefault();

                // Remove the text
                text.style.display = "none";
                button.style.display = "none";
                imagefraction.style.display = "none";

                // Start the game
                doGame();
            });
        }
        else {
            doGame();
        }
    }

    function getRandomFact() {
        let fact = "";

        let random = Math.floor(Math.random() * facts.length);

        fact = facts[random];

        return fact;
    }


    let facts;

    // Get facts from facts.txt
    fetch('./facts.txt')
        .then(response => response.text())
        .then(text => {
            facts = text.split('\n');
        });
    
    //Uncomment to enable ip_address storing
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            // ip_address = data.ip
            ip_address = ""
        })
        .catch(error => {
            console.log("[ERROR] Cannot retrieve IP")
            ip_address = ""
    });

    doDisclaimer();