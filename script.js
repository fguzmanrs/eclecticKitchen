
var state = {
    searchIngredients: [],
    numOfRequest: 10, //how many recipe to get from server? (1-100)
    numOfRender: 3, //how many recipe to render to DOM
    rawData: [],
    recipes: [],
    likes: [],
    currentModal: null,
    currentCollap: null
}


$('document').ready(function () {

    // var apiKey = "d0aef524cfc14d6ba3f35bc68ab620b9"; //FGuzman
    // var apiKey = "06238180649d43e0bffc9f3ac6536dc3"; //HCross
    var apiKey = "5aac1a10cd874816809acc6f2d2fa006"; //FOrtiz
    // var apiKey = "bb5452cb4b074d1a899410830c863f29"; //Emily
    // var apiKey = "d453036a9eeb46a1b474c7043973a767"; //xapienx.com
    // var apiKey = "f4abc8a8916747b3a3976addc1321ab0"; //birulaplanet.com
    // var apiKey = "0421115dd3974c7f9338166f3e907824"; //Emily2

    /**********************************/
    /*           EVENT HANDLER        */
    /**********************************/
  
    // Hide/Show input validity symbol 
    function showValidityHandler(){

        if($('#inputIng').val().trim().length > 0){
            $('.validity').removeAttr('hidden');
        }

    }
    function addIngredientToList(e) {

        e.preventDefault();
        
        var inputIngredient = $('#inputIng').val().trim(); console.log(inputIngredient);

        // Proceed only when the input is not duplicated
        if (state.searchIngredients.indexOf(inputIngredient) === -1) {

            // 1. Lender search list
            renderSearchList(inputIngredient);

            // 2. Save input to state data
            state.searchIngredients.push(inputIngredient);

            // 3. Save input data to local storage
            saveToLocalStorage('ingredients', state.searchIngredients);
        }

        // 4. Clear input text
        $('#inputIng').val("");

        // 5. Hide validity symbol
        $('.validity').attr('hidden', 'hidden');
    }
    async function searchBtnHandler(e) {

        e.preventDefault();

        if (state.searchIngredients.length > 0) {

            await getRecipesByIngredients(state.searchIngredients);

            // Take only necessary info from raw data and create each recipe obj. Then add all recipe objs to one arr.
            createRecipesArr();

            // animation for waiting
            $('#recipes').empty();
            var waiting = `<div class="row">
                            <br><br><br><br>
                            <div class="progress">
                               <div class="indeterminate"></div>
                            </div>
                        </div>`

            $('#recipes').append(waiting);

            // PASS2: validate/populate preparation steps into object
            for (var i = 0; i < state.recipes.length; ++i)
                await getInstructionsByRecipeId(state.recipes[i].id, i);

            // PASS3: Render recipes to DOM
            renderRecipesList();

            //! [For Test] Insert for render test when API keys run out.(saving search result)
            localStorage.setItem('tempRecipes', JSON.stringify(state.recipes));
            //! **********************************************************
        }
        else {

            var message = "No ingredient entered! Please add at least one ingredient to search recipes.";
            errorAlertModal(message);

        }

    }
    function favoriteMenuHandler() {

        var l = state.likes.length;

        $('#modal-list').empty();

        // Render favorite recipe list
        if (l > 0) {
            var list = "";

            for (var i = 0; i < l; i++) {

                var like = state.likes[i];

                list += `<li class="favorite__list">
                            <a href="#${i}">
                                <img src="${like.imgSmall}" class="favorite__img">
                                <div>
                                    <h6 class="favorite__title">${like.title}</h6>
                                    <p class="favorite__ing">Used ingredients: ${like.usedIngredients}</p>
                                </div>
                            </a>
                        </li>`
            }

        }
        else {
            var list = '<h6> There is no favorite added.</h6>'
        }

        $('#modal-list').append(list);

        state.currentModal = M.Modal.getInstance(document.querySelector('#modal-favorite'));
        state.currentModal.open();

    }
    function gotoFavoriteHandler(e) {

        // If favorite recipe list is clicked, render details to DOM
        if(e.target.matches('.favorite__list, .favorite__list *')){

            $('#recipes').empty();

            if(state.currentModal){

                // Find which recipe is clicked
                var index = e.target.closest('a').getAttribute('href').slice(1);

                // Render that recipe to DOM
                renderRecipe(state.likes[index]);

                // Close modal
                state.currentModal.close();
            }
        }
    }
    function favoriteIconHandler(e) {

        // If heart icon is clicked
        if (e.target.matches('.icon-heart, .icon-heart *')) {

            // 1. Find which recipe is clicked
            var recipeHTML = $(e.target).closest('.recipe');
            var recipeIndex = recipeHTML.attr('data-recipe');
            var recipeObj = state.recipes[recipeIndex];

            // 2. Toggle the recipe's property 'isLiked' value (true or false)
            recipeObj.isLiked = recipeObj.isLiked ? false : true;

            // 3. Toggle heart icone +,- shape
            var useHTML = recipeHTML.find('use[id="icon-heart-img"]');
            var path = useHTML.attr('xlink:href').split('-')[2];

            useHTML.attr('xlink:href', `./assets/icons/sprite.svg#icon-heart-${path === "plus" ? 'minus' : 'plus'}`);


            // 4. Save likes to state data 

            if (recipeObj.isLiked) { // if isLiked === true

                state.likes.push(recipeObj); console.log('new like obj added: ', state.likes);

            }
            else { // if isLiked === false

                var index = state.likes.findIndex(function (el) {
                    return el.id === recipeObj.id;
                })

                state.likes.splice(index, 1); 
                console.log('updated like obj after deleting: ', state.likes);

            }

            // 5. Save likes to local storage
            saveToLocalStorage('likes', state.likes);

        }
    }

    /**********************************/
    /*              APIs              */
    /**********************************/

    async function getRecipesByIngredients(ingredients) {

        try{
            await $.ajax({
                url: `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&number=${state.numOfRequest}&ranking=1&ignorePantry=true&ingredients=${ingredients}`,
                method: 'GET'
            }).then(function (response) { state.rawData = response })

    
            if (state.rawData.length === 0) {
    
                var message = "We cannot find any recipe with your ingredient. Please make sure that you enter at least one valid ingredient.";
                errorAlertModal(message);
    
                throw new Error("🚧 No recipe returned. The app is stopped.");
    
            }
        }
        catch{

            var message = "An error occured while geting recipes from server. Please try again later.";
            errorAlertModal(message);

            throw new Error("🚧 Unkown server error occured while getting recipes. The app is stopped.");
        }
        

    }
    async function getInstructionsByRecipeId(recipeId, k) {

        // PASS 2: Validate against preparation steps (note empty)
        // if not empty then populate preparation steps on object
        try{
            var arr = [];
            console.log("apiKey: " + apiKey);
            var queryURL = `https://api.spoonacular.com/recipes/${recipeId}/analyzedInstructions?apiKey=${apiKey}`;
    
            await $.ajax({
                url: queryURL,
                method: "GET"
            }).then(function (data) {
    
                var i, j;
    
                // Traverse steps on response and push in an array, then return array
                for (i = 0; i < data.length; ++i)
                    for (j = 0; j < data[i].steps.length; ++j)
                        arr.push(data[i].steps[j].step);
    
                // PASS2 : Validate/Populate
                // if no steps then doRender = False (do not render in next step)
    
                state.recipes[k].doRender = false;
    
                if (arr.length > 0) {
                    // Response has data then populate object
                    state.recipes[k].steps = arr;
                    // Preparation steps found, set render flag to true
                    state.recipes[k].doRender = true;
                }
    
            });
        }
        catch{

            var message = "An error occured while geting recipes from server. Please try again later.";
            errorAlertModal(message);

            throw new Error("🚧 Unkown server error occured while getting recipes. The app is stopped.");
        }
        
    }

    /**********************************/
    /*              FUNCTION          */
    /**********************************/

    function createRecipesArr() {

        var recipesArr = [];

        var l = state.rawData.length;
        for (var i = 0; i < l; i++) {

            var rawRecipe = state.rawData[i];
            var recipeObj = {}; // format: { id: , title: , usedIng: , missedIng: , imgSmall: ,imgLarge: }

            // 1. add id, title, img to RecipeObj
            recipeObj.id = rawRecipe.id;
            recipeObj.title = rawRecipe.title;
            recipeObj.imgSmall = rawRecipe.image;
            recipeObj.imgLarge = resizeImg(rawRecipe.image);

            // 2. add used ingredients arr to RecipeObj
            recipeObj.usedIngredients = createIngArr(rawRecipe.usedIngredients);

            // 3. add missed ingredients arr to RecipeObj
            recipeObj.missedIngredients = createIngArr(rawRecipe.missedIngredients);

            // 4. add like factor
            recipeObj.isLiked = isLikedOrNot(recipeObj);

            recipesArr.push(recipeObj);
        }

        // Save the created array to state database
        state.recipes = recipesArr;
    }
    function renderRecipesList() {

        $('#recipes').empty();

        for (var i = 0; i < state.numOfRender; i++) {

            var recipeObj = state.recipes[i];

            renderRecipe(recipeObj, i);

        }
    }
    function renderRecipe(obj, i = 0) {
        //! [For Test] part to comment out when saving API calls
        // check for 'complete' recipe meaning: recipe with preparation steps 
        if (obj.doRender === false) return;

        // create preparation steps HTML
        var li = "";
        for (let j = 0; j < obj.steps.length; ++j)
            li += `<br>${j+1}. ${obj.steps[j]}<br>`;

            var recipe = `<div class="row">
                            <div class="col">
                                
                                <div class="recipe card" data-recipe="${i}">
                                    <div class="card-image">
                                        <img class="recipe__image materialboxed" width="650" src="${obj.imgLarge}" data-recipe__image="recipe__image${i}">
                                        <a class="activator btn-floating halfway-fab waves-effect waves-light green">
                                            <i class="activator material-icons">
                                                <svg class="activator icon icon-cook">
                                                    <use class="activator" id="icon-cook-img" xlink:href="./assets/icons/sprite.svg#icon-cook"></use>
                                                </svg>
                                            </i>
                                        </a>
                                    </div>
                                    <div class="recipe__detail card-content">
                                        <h5>
                                            ${obj.title}
                                            <span class="favoriteIcon">
                                                <svg class="icon icon-heart">
                                                    <use xlink:href="./assets/icons/sprite.svg#icon-heart-${obj.isLiked ? 'minus' : 'plus'}" id="icon-heart-img"></use>
                                                </svg>
                                            </span>
                                        </h5>
                                        <div class="recipe__detail--ingredient"> 
                                            <div><h6>Used Ingredients</h6><ul class="ingredients--used"></ul></div>
                                            
                                            <div><h6>Missed Ingredients</h6><ul class="ingredients--missed"></ul></div>
                                        </div>
                                        
                                    </div> 
                                    <div class="card-reveal">
                                        <span class="card-title grey-text text-darken-4">How to cook<i class="material-icons right" id="icon-close">x</i></span>
                                        <p>${li}</p>
                                    </div>
                                </div>

                            </div>
                        </div>`

        $('#recipes').append(recipe);
        renderIngredients('.ingredients--used', i, obj.usedIngredients);
        renderIngredients('.ingredients--missed', i, obj.missedIngredients);
        
    }
    function renderIngredients(addTo, order, arr) {

        var l = arr.length;

        if (l > 0) {

            var list = "";

            for (var i = 0; i < l; i++) {
                list = list + `<li>${arr[i]}</li>`;
            }

            $(`${addTo}`).eq(order).append(list);
        }

    }
    function renderSearchList(str) {

        var li = `<li class="collection" data-ingredient="${str}">
                    ${str}
                    <span class="delete"> &#215; </span>
                  </li>`;

        $('#searchList').append(li);

    }
    function deleteIngredient(e) {

        if (e.target.matches('span[class=delete]')) {

            var li = $(e.target).closest('li');

            // Delete the ingredient from state data & local storage
            var ingredient = li.attr('data-ingredient');
            var index = state.searchIngredients.indexOf(ingredient);

            state.searchIngredients.splice(index, 1);
            saveToLocalStorage('ingredients', state.searchIngredients);

            // Delete from DOM
            li.remove();

        }
    }
    function init() {

        //![For Test] Insert for render test when API keys run out.(saving search result)
        $('#modal-list').empty();
        localStorage.removeItem('likes');

        var loadedData = localStorage.getItem('tempRecipes');

        if(loadedData){
            state.recipes = JSON.parse(loadedData);
            renderRecipesList();
        }
        //! ***********************************************************    

        // Initiate all Materialize components
        M.AutoInit();

        // render recipe image larger
        $('.materialboxed').materialbox();

        // Load from local storage
        importFromLocalStorage('ingredients', 'searchIngredients');
        importFromLocalStorage('likes', 'likes');

        // Render stored search list to DOM
        var l = state.searchIngredients.length;

        if (l > 0) {
            for (var i = 0; i < l; i++) {
                renderSearchList(state.searchIngredients[i]);
            }
        }
   
    }
    function importFromLocalStorage(item, addTo) {

        var loadedData = localStorage.getItem(item);

        if (loadedData) {
            state[addTo] = JSON.parse(loadedData);
        }
    }
    function saveToLocalStorage(addTo, data) {

        // var duplicateDeletedArr = Array.from(new Set(data));
        localStorage.setItem(addTo, JSON.stringify(data));

    }
    function isLikedOrNot(obj) {

        var likedIds = state.likes.map(function (el) { return el.id });

        // If obj has the same id of likedIds obj, return true
        var index = likedIds.indexOf(obj.id);

        return index === -1 ? false : true;

    }
    function errorAlertModal(message){

        var instance = M.Modal.getInstance(document.querySelector('#modal-alert'));
        
        $('#modal-message').text(message);
        instance.open();

    }
    /**********************************/
    /*              UTILITY           */
    /**********************************/

    // Take only ingredient's NAME property
    function createIngArr(ingArr) {

        var newArr = ingArr.map(function (el) { return el.name });

        // delete duplicated elements
        newArr = Array.from(new Set(newArr));

        return newArr;
    }
    function resizeImg(str) {

        // Change default size(312x231) to max-size(636x393)
        return str.replace("312x231", "636x393");

    }

    /**********************************/
    /*               EVENT            */
    /**********************************/

    $('#searchBtn').click(searchBtnHandler);
    $('#inputIng').on('input',showValidityHandler);
    $('#search-card').submit(addIngredientToList);
    $('#searchList').click(deleteIngredient);

    // Favorite menu button
    $('#favoriteMenu').on('click', favoriteMenuHandler);
    $('#modal-list').on('click', gotoFavoriteHandler);

    // Each recipe's favorite button
    $('#recipes').click(favoriteIconHandler);

    init();

});

// When you run out API keys, please insert above two codes(specified with '//!') then add below data to local storage manually.
// property name : tempRecipes 
/* value: 
[{"id":556811,"title":"Five-Spice Steaks with Ginger Butter","imgSmall":"https://spoonacular.com/recipeImages/556811-312x231.jpg","imgLarge":"https://spoonacular.com/recipeImages/556811-636x393.jpg","usedIngredients":["butter","fresh ginger","steaks"],"missedIngredients":["5 spice powder","bell pepper","garlic powder"],"isLiked":false,"doRender":true,"steps":["(To use the tenderizing method I talked about, click the link within the post to read the details.)Preheat your BBQ grill or stove-top (oven-safe) pan to medium-high heat. (If you're using a pan, also preheat your oven to about 400 degrees F.)","Combine the garlic powder, five-spice powder, and pepper in a small bowl. If you aren't using the tenderizing method, also add 1/4 teaspoon of salt. Rub the spice mixture on the steaks. I only rubbed it on one side, but you can do both if you like.","Place the steaks on the grill (or pan) spice-side down and let them cook, undisturbed for 3-4 minutes, until grill marks (or dark sear marks) form. Flip the steak and cook for another few minutes, until the steak is cooked to your liking. (We like them medium to medium well.) If you're doing it in a pan, you'll need to transfer the pan to the oven for several minutes.","Transfer to a platter and cover to keep warm.","Let the steaks sit for at least 5 minutes before slicing to retain their juices.Meanwhile, combine the butter and ginger in a small bowl.","Add a spoonful to each steak before serving. You can also make this ahead of time, wrap it up in wax paper, and store it in the freezer. It slices into \"coins\" nicely that way. (see the link within the post for photos)"]},{"id":334811,"title":"Szechwan Pepper-Crusted Steak Smothered with Onions","imgSmall":"https://spoonacular.com/recipeImages/334811-312x231.jpeg","imgLarge":"https://spoonacular.com/recipeImages/334811-636x393.jpeg","usedIngredients":["ginger","steak"],"missedIngredients":["allspice berries","balsamic vinegar","onions","unsalted butter"],"isLiked":false,"doRender":true,"steps":["To make the onions, slice the onions in half through the stem. With a mandoline or vegetable slicer or a thin sharp knife, cut lengthwise into 1/8-inch slices. (You should have about 6 cups.)","In a large nonstick skillet, melt the butter over moderately low heat.","Add the onions, sprinkle with 1/2 teaspoon of the salt, and toss to coat. Cover and cook until the onions have released their liquid, about 13 minutes.","Uncover the pan, increase the heat to moderate, and cook slowly, stirring occasionally, until the liquid has evaporated, about 10 minutes. Sprinkle the onions with the sugar and continue cooking, stirring frequently, until they are golden brown and caramelized, about 10 minutes longer. Sprinkle with the balsamic vinegar and toss until the vinegar has evaporated.","Add the remaining 1/4 teaspoon salt, and season generously with pepper.","Remove from the heat and cover to keep warm.","Meanwhile, prepare the pepper rub: In a small heavy skillet, toast the peppercorns and allspice over moderate heat, shaking the pan occasionally, until fragrant, about 3 minutes.","Transfer to a blender or spice grinder and grind to a fine powder. Strain the spices into a small bowl and return the coarse bits to the blender. Blend again and strain.","Pat the steaks dry with paper towels; rub lightly with a little of the oil. Sprinkle lightly with salt and massage the ginger into the steak; then rub the pepper rub over them.","Heat a grill pan or heavy nonstick skillet over high heat. Lightly oil the grill pan, if using, or swirl the remaining oil in a nonstick skillet.","Add the steaks to the pan and cook until little droplets of blood form on the surface, about 4 minutes. Turn the steaks over and continue cooking until a droplet or so of blood forms on the top again, another 3 to 4 minutes, for rare.","Transfer the steak to a cutting board and let rest for 5 to 10 minutes.","With a thin sharp knife, slice the steaks on a slight angle against the grain. Sprinkle the meat with a little salt and arrange the slices warm diner plates. Nestle a mound of onions next to the steak."]},{"id":745299,"title":"Hawaiian Teriyaki Steak","imgSmall":"https://spoonacular.com/recipeImages/745299-312x231.jpeg","imgLarge":"https://spoonacular.com/recipeImages/745299-636x393.jpeg","usedIngredients":["butter","ginger"],"missedIngredients":["garlic","onion","pineapple","scallions","sirloin tip steak"],"isLiked":false,"doRender":true,"steps":["Combine all ingredients in a resealable plastic bag. Squeeze out as much air as possible and marinate the steak in the refrigerator at least 8 hours or overnight.","Remove the meat from the marinade and place on the grill. Grill to desired temperature; medium-rare is best.","Core and slice a fresh pineapple into 1/4-inch rectangles. Melt 3 tablespoons of butter.","Place pineapple rafts on the grill and brush with melted butter. Grill until warm, with nice grill marks.","Serve with the grilled beef, if desired, garnished with scallions."]},{"id":382146,"title":"Teriyaki Sandwiches","imgSmall":"https://spoonacular.com/recipeImages/382146-312x231.jpg","imgLarge":"https://spoonacular.com/recipeImages/382146-636x393.jpg","usedIngredients":["beef steak","butter"],"missedIngredients":["cornstarch","garlic clove","green onions","ground ginger","pineapple rings","sub rolls"],"isLiked":false,"doRender":true,"steps":["Cut steak into thin bite-size slices. In a 3-qt. slow cooker, combine the soy sauce, sugar, ginger and garlic.","Add steak. Cover and cook on low for 7-9 hours or until meat is tender.","Remove meat with a slotted spoon; set aside. Carefully pour liquid into a 2-cup measuring cup; skim fat.","Add water to liquid to measure 1-1/2 cups.","Pour into a large saucepan.","Combine cornstarch and water until smooth; add to pan. Cook and stir until thick and bubbly, about 2 minutes.","Add meat and heat through.","Brush rolls with butter; broil 4-5 in. from the heat for 2-3 minutes or until lightly toasted. Fill with meat, pineapple and green onions."]},{"id":471388,"title":"Easy Stir-Fried Beef With Mushrooms and Butter","imgSmall":"https://spoonacular.com/recipeImages/471388-312x231.jpg","imgLarge":"https://spoonacular.com/recipeImages/471388-636x393.jpg","usedIngredients":["butter","ginger"],"missedIngredients":["cooked white rice","cornstarch","flank steak","mushrooms","garlic","shaoxing wine"],"isLiked":false,"doRender":true,"steps":["Place the beef in a large bowl.","Add the salt, sugar, ground black pepper, Shaoxing wine, soy sauce, 1 teaspoon oil, and cornstarch.","Mix well and set aside for 30 minutes.","When ready to cook, heat 2 tablespoons oil in a wok over high heat until smoking.","Add the ginger. Cook for 30 seconds and then remove and discard the ginger.","If the wok is no longer smoking, reheat until it is, then add the beef.","Spread the beef out with the spatula, cook without moving until lightly browned, about 1 minute. Continue to cook while stirring regularly until half cooked, about 2 minutes longer.","Transfer to a bowl and set aside.","Heat 1 tablespoon oil in wok over high heat until smoking.","Add the mushrooms. Stir and cook the mushrooms until they start releasing their water. Continue cooking, stirring frequently, until the water evaporates. Depending on the type of mushrooms you use, this can take 5 minutes or more.","Once the water evaporates, add 2 teaspoons of soy sauce. Stir and add in the butter and garlic. Toss the butter with the mushrooms until fragrant, about 1 minute, then return the beef to the wok. Cook, stirring, until beef is cooked through, about 1 minute longer.","Transfer to a serving platter immediately and serve with white rice."]},{"id":101029,"title":"Teriyaki Steak Recipe","imgSmall":"https://spoonacular.com/recipeImages/101029-312x231.png","imgLarge":"https://spoonacular.com/recipeImages/101029-636x393.png","usedIngredients":["beef steak","butter"],"missedIngredients":["balsamic vinegar","cooked rice","eggs","garlic cloves","ground ginger","honey","pearl onions"],"isLiked":false,"doRender":false},{"id":40372,"title":"Skirt Steak with Shiso-Shallot Butter","imgSmall":"https://spoonacular.com/recipeImages/40372-312x231.jpg","imgLarge":"https://spoonacular.com/recipeImages/40372-636x393.jpg","usedIngredients":["fresh ginger","steaks"],"missedIngredients":["garlic cloves","hoisin sauce","rice vinegar","scallions","shallots","shiso leaves","unsalted butter"],"isLiked":false,"doRender":true,"steps":["In a bowl, mix all of the ingredients except the steaks. Lay the steaks in a large roasting pan in a single layer.","Pour the marinade over the meat and turn to coat. Cover and refrigerate for 2 hours.","In a medium skillet, heat the olive oil.","Add the shallots and cook over moderate heat until softened and lightly browned, about 10 minutes.","Add the soy sauce and simmer until evaporated, 2 minutes; let cool.","In a bowl, mix the shallots, shiso leaves and peppercorns into the butter.","Transfer to the refrigerator.","Light a grill. Grill the steaks over a hot fire for 3 to 4 minutes per side for medium-rare meat.","Transfer to a carving board and let rest for 5 to 10 minutes. Meanwhile, grill the scallions, turning, until lightly charred all over, about 2 minutes. Thinly slice the steaks against the grain and transfer to a platter along with the scallions. Top the skirt steaks with the shiso butter and serve them at once."]},{"id":1129283,"title":"Beef and Ginger Stir-Fry","imgSmall":"https://spoonacular.com/recipeImages/1129283-312x231.jpg","imgLarge":"https://spoonacular.com/recipeImages/1129283-636x393.jpg","usedIngredients":["ginger root"],"missedIngredients":["skirt steak","sweet onion","unsalted butter","lemon juice","cooked rice"],"isLiked":false,"doRender":false},{"id":514789,"title":"Balsamic Glazed Flank Steak","imgSmall":"https://spoonacular.com/recipeImages/514789-312x231.jpg","imgLarge":"https://spoonacular.com/recipeImages/514789-636x393.jpg","usedIngredients":["fresh ginger"],"missedIngredients":["balsamic vinegar","chicken stock","flank steak","garlic cloves","sake","shallot","unsalted butter"],"isLiked":false,"doRender":true,"steps":["Start with the marinade.  Melt butter in a medium saucepan under medium high heat.","Add shallots, garlic, and ginger and saute until they soften, about 3 to 5 minutes.","Add the balsamic vinegar to the saucepan and bring to a slow boil.  When at a boil, reduce heat to a simmer and let reduce for about 15 minutes.  The sauce will be slightly thickened.","Add sugar or honey, chicken stock, soy sauce, and sake.  Bring to another boil.","Let mixture cool to room temperature and reserve a 1/4 cup of the liquid for finished steak.","Place flank steak into large dish and cover with remaining marinade liquid.  Cover dish with plastic wrap and let marinate in the fridge for about 2 hours or longer.  Also place the reserved marinade in the fridge while the meat is marinating.Prior to cooking steak, drain marinade and pat steak dry.","Heat the grill (or large skillet) under high heat (add 1 tbsp of olive oil for skillet).","Put the flank steak on the grill and start on high for 2 minutes on each side, with the grill cover closed.  Then turn the heat to medium and turn the flank steak over  every two minutes for about another 12 minutes with the cover open for a total cooking time of around 15-20 minutes.  Flank Steak is dense and take a little longer to cook.  When done.","Let the steak rest on cutting board for about 5-7 minutes before slicing against the grain.  While the steak is resting, you can heat up the reserved marinade.  Just bring to a simmer until mixture is heated through."]},{"id":81369,"title":"Japanese-style Flatiron Steak","imgSmall":"https://spoonacular.com/recipeImages/81369-312x231.jpg","imgLarge":"https://spoonacular.com/recipeImages/81369-636x393.jpg","usedIngredients":["fresh ginger"],"missedIngredients":["fresh chives","molasses","red pepper flakes","rice vinegar","sake","sirloin steak","unsalted butter","wasabi powder"],"isLiked":false,"doRender":false}]
*/
