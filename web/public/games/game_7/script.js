// Fonction pour ajuster la taille du texte
function adjustTextSize() {
    // Récupérer les dimensions du conteneur et du parchemin
    const phraseContainer = document.querySelector('.phrase-container');
    const phraseBackground = document.querySelector('.phrase-background');
    
    if (!phraseContainer || !phraseBackground || !phraseContentElement) {
        return;
    }
    
    // Attendre que l'image du parchemin soit chargée
    if (!phraseBackground.complete) {
        phraseBackground.onload = adjustTextSize;
        return;
    }
    
    // Calculer le rapport de taille du parchemin
    const backgroundRatio = phraseBackground.naturalWidth / phraseBackground.naturalHeight;
    const containerRatio = phraseContainer.offsetWidth / phraseContainer.offsetHeight;
    
    // Déterminer les dimensions réelles du parchemin dans le conteneur
    let effectiveWidth, effectiveHeight;
    
    if (backgroundRatio > containerRatio) {
        // Limité par la largeur
        effectiveWidth = phraseContainer.offsetWidth;
        effectiveHeight = phraseContainer.offsetWidth / backgroundRatio;
    } else {
        // Limité par la hauteur
        effectiveHeight = phraseContainer.offsetHeight;
        effectiveWidth = phraseContainer.offsetHeight * backgroundRatio;
    }
    
    // Estimer la zone de texte utilisable (augmenté de 65% à 75%)
    const usableRatio = 0.75;
    const usableWidth = effectiveWidth * usableRatio;
    const usableHeight = effectiveHeight * usableRatio;
    
    // Mise à jour des dimensions de la zone de texte
    phraseContentElement.style.width = `${usableWidth}px`;
    phraseContentElement.style.maxHeight = `${usableHeight}px`;
    
    // Adapter la taille du texte pour qu'il tienne correctement
    // On utilise une technique d'essais successifs
    let fontSize = parseInt(window.getComputedStyle(phraseContentElement).fontSize);
    let maxFontSize = 28; // Taille maximale en pixels (réduite de 32 à 28)
    let minFontSize = 12; // Taille minimale en pixels
    
    // Réinitialiser à une taille raisonnable pour commencer
    phraseContentElement.style.fontSize = `${maxFontSize}px`;
    
    // Réduire progressivement si le contenu déborde
    while (
        (phraseContentElement.scrollHeight > phraseContentElement.offsetHeight ||
         phraseContentElement.scrollWidth > phraseContentElement.offsetWidth) && 
        fontSize > minFontSize
    ) {
        fontSize -= 1;
        phraseContentElement.style.fontSize = `${fontSize}px`;
    }
    
    // Ajouter un facteur de réduction supplémentaire pour garantir qu'il reste de l'espace
    fontSize = Math.max(minFontSize, fontSize - 2);
    phraseContentElement.style.fontSize = `${fontSize}px`;
    
    // Ajuster également la taille des trous pour correspondre à la taille du texte
    const holes = document.querySelectorAll('.hole, .wrong-hole');
    holes.forEach(hole => {
        hole.style.width = `${fontSize * 2.5}px`;
        hole.style.height = `${fontSize * 1.2}px`;
    });
}// Variables du jeu
let phrases = [];
let currentPhraseIndex = 0;
let currentScore = 0;
let gameStartTime;
let maxScore = 0;
let selectedOption = null;
let remainingHoles = 0;
let totalPhrases = 10;

// Éléments DOM
let phraseContentElement;
let optionMaElement;
let optionMonElement;
let optionMesElement;

// Fonction d'initialisation (OBLIGATOIRE)
function initGame() {
    console.log('Initialisation du jeu de formules magiques');
    
    // 1. Récupérer les références aux éléments DOM
    phraseContentElement = document.getElementById('phrase-content');
    optionMaElement = document.getElementById('option-ma');
    optionMonElement = document.getElementById('option-mon');
    optionMesElement = document.getElementById('option-mes');
    
    // 2. Générer les phrases pour le jeu
    generatePhrases();
    
    // 3. Ajouter les écouteurs d'événements
    optionMaElement.addEventListener('click', () => selectOption('ma'));
    optionMonElement.addEventListener('click', () => selectOption('mon'));
    optionMesElement.addEventListener('click', () => selectOption('mes'));
    
    // 4. Adapter le texte au redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        if (currentPhraseIndex < phrases.length) {
            adjustTextSize();
        }
    });
    
    // 5. Démarrer le jeu
    startGame();
}

// Fonction de démarrage du jeu
function startGame() {
    // Initialiser les variables du jeu
    currentPhraseIndex = 0;
    currentScore = 0;
    gameStartTime = Date.now();
    
    // Mettre à jour le score dans l'interface
    updatetopbar_score(currentScore);
    
    // Afficher la première phrase
    displayPhrase();
}

// Fonction pour générer les phrases
function generatePhrases() {
    // Array de phrases avec les déterminants possessifs ma/mon/mes adaptées aux enfants
    const allPhrases = [
        // Phrases originales
        "Je remue mon chaudron vert et ajoute ma bave de crapaud à mes pattes de cafard.",
        "Dans ma soupe de limace et mon chocolat au camembert, je mets mes bonbons au poivre.",
        "Je lève ma cuillère magique et goûte mon jus de chaussette avec mes crottes de nez magiques.",
        "Je mélange ma gelée de vers et mon sirop de cactus pour faire mes bulles qui pètent.",
        "Avec ma baguette en carotte et mon chapeau en fromage, je transforme mes souris en gâteaux.",
        "Je range ma boîte à mouches et mon sac de crottes dans mes poches secrètes.",
        "J'agite mon balai poilu et jette ma poudre qui pue dans mes potions gluantes.",
        "J'ai oublié ma fourchette volante et mon assiette qui parle pour manger mes spaghettis dansants.",
        "Je range ma chambre avec mon aspirateur à pets et ramasse mes chaussettes magiques.",
        "J'ai perdu ma dent de lait et mon poil de nez dans mes poches pleines de sable.",
        "Je cache mon caillou qui brille et ma plume de pigeon sous mes oreillers à rêves.",
        "Je dessine ma licorne à trois pattes et mon dragon à lunettes sur mes cahiers secrets.",
        "Je partage ma glace au concombre et mon gâteau aux épinards avec mes amis imaginaires.",
        "Je nourris ma grenouille qui chante et mon chat à deux queues avec mes céréales au ketchup.",
        "J'ai cassé ma baguette en réglisse et mon chapeau en papier avec mes maladresses magiques.",
        "Je verse ma potion à chatouilles et mon élixir de fou rire dans mes fioles colorées.",
        "Je récite ma formule pour les crottes de nez et mon sort pour les pets avec mes doigts croisés.",
        "Dans ma cabane secrète, j'utilise mon télescope en carton pour observer mes étoiles brillantes.",
        "J'ai rangé ma collection de crottes et mon bocal de morve sous mes planches grinçantes.",
        "Je garde ma pierre qui pue et mon bâton magique dans mes poches à surprises.",
        "Je mets ma cape invisible et mon masque à boutons pour effrayer mes petits frères.",
        "Je prépare ma tarte aux cailloux et mon gâteau de boue pour mes invités imaginaires.",
        "J'attrape ma souris qui parle et mon crapaud danseur pour faire mes tours de magie.",
        "Je fabrique ma potion qui rend vert et mon sirop qui fait roter dans mes tubes à essai.",
        "J'ai caché ma clé en chocolat et mon trésor en papier sous mes chaussettes sales.",
        "Je porte ma couronne en carton et mon épée en mousse pour protéger mes jouets préférés.",
        "Je coupe mes tomates volantes avec ma cuillère en bois et mon couteau qui chante.",
        "Je prépare ma pâte à slime et mon savon qui glisse pour mes expériences bizarres.",
        "Je transforme ma chambre en château et mon lit en bateau avec mes pouvoirs imaginaires.",
        "J'ai mis ma chaussette qui pue et mon fromage moisi dans mes potions secrètes.",
        "Je lance ma boulette de papier et mon avion magique vers mes cibles dessinées.",
        "Je verse ma poudre à éternuer et mon liquide qui chatouille sur mes cobayes volontaires.",
        "J'ai perdu ma bille enchantée et mon dé magique dans mes poches trouées.",
        "Je nourris ma plante carnivore et mon poisson volant avec mes miettes de biscuits.",
        "Je range ma collection de croûtes et mon album de taches dans mes tiroirs secrets.",
        "J'enfile ma chaussette volante et mon gant sauteur sur mes membres endormis.",
        "J'utilise ma loupe grossissante et mon crayon qui écrit tout seul pour faire mes devoirs magiques.",
        "J'ai avalé ma salive de dragon et mon jus de chaussette pendant mes expériences ratées.",
        "Je touille mon yaourt aux vers de terre et ma soupe aux chaussettes avec mes doigts poilus.",
        "Je lave ma brosse à dents magique et mon peigne volant avec mes larmes de crocodile.",
        "J'ai perdu ma gomme qui rebondit et mon crayon qui chatouille dans mes affaires en désordre.",
        "Je construis ma cabane en crottes et mon château en morve avec mes talents d'architecte.",
        "Je range ma poudre de prout et mon élixir de rot dans mes flacons colorés.",
        "J'ai renversé ma potion de fou rire et mon philtre d'amitié sur mes vêtements propres.",
        "Je lis ma bande dessinée préférée et mon livre de sorts faciles sous mes couvertures lumineuses.",
        "Je dessine ma carte au trésor et mon plan d'évasion sur mes serviettes en papier.",
        "J'ai perdu ma boussole qui ment et mon GPS farfelu dans mes poches infinies.",
        "Je tape sur mon tambour silencieux et ma trompette à bulles pour réveiller mes voisins endormis.",
        "Je transforme ma chambre en désordre et mon bureau en chaos avec mes tours de magie ratés.",
        "J'ai avalé ma pilule de croissance et mon bonbon rapetissant pendant mes expériences dangereuses.",
        
        // Nouvelles phrases supplémentaires
        "Je mélange ma morve d'éléphant et mon jus de chaussette pour préparer mes potions puantes.",
        "J'ai caché ma brosse à dents volante et mon savon sauteur dans mes tiroirs secrets.",
        "Je verse mon sirop de pizza et ma sauce au chocolat sur mes céréales multicolores.",
        "J'utilise ma cuillère en caoutchouc et mon fouet magique pour battre mes œufs carrés.",
        "Je pousse ma brouette de crapauds et mon chariot de limaces vers mes jardins enchantés.",
        "J'ai perdu ma clé qui chante et mon cadenas qui danse dans mes poches percées.",
        "Je porte ma chemise en peau de banane et mon pantalon en feuilles pour impressionner mes amis.",
        "J'agite ma baguette en spaghetti et mon sceptre en carotte pour lancer mes sorts rigolos.",
        "Je prépare ma soupe aux orteils et mon ragoût de chaussettes pour mes monstres affamés.",
        "J'ai cassé ma tasse qui parle et mon assiette qui vole pendant mes repas magiques.",
        "Je démêle ma barbe de sorcier et mon chapeau pointu avant mes spectacles de magie.",
        "J'ai avalé ma potion de hoquet et mon sirop de rire pendant mes expériences dangereuses.",
        "Je range ma collection de crottes de nez et mon album de taches dans mes coffres secrets.",
        "Je porte ma cape en papier toilette et mon masque en éponge pour effrayer mes petites sœurs.",
        "J'ai caché ma baguette en sucre et mon grimoire en chocolat sous mes oreillers magiques.",
        "Je lance mon sort de chatouilles et ma formule de transformation sur mes peluches vivantes.",
        "Je prépare ma gelée de moustiques et mon smoothie aux vers pour mes invités spéciaux.",
        "J'ai rangé ma boîte à rots et mon sac à pets dans mes armoires secrètes.",
        "Je mélange mon yaourt aux orties et ma crème aux épinards pour mes desserts spéciaux.",
        "J'utilise ma cuillère télescopique et mon bol extensible pour mes céréales géantes.",
        "Je verse ma potion qui fait voler et mon élixir de super force dans mes bouteilles colorées.",
        "J'ai perdu ma chaussure bondissante et mon chapeau volant dans mes aventures magiques.",
        "Je garde ma poudre de licorne et mon jus de dinosaure dans mes fioles mystérieuses.",
        "Je prépare ma tarte aux cailloux et mon gâteau de boue pour mes fêtes d'anniversaire.",
        "J'ai renversé ma potion d'invisibilité et mon philtre d'amour sur mes devoirs d'école.",
        "Je range ma collection de mouches et mon élevage de cafards dans mes boîtes transparentes.",
        "Je mélange mon sirop de cactus et ma sauce aux orties pour mes pancakes du matin.",
        "J'ai caché ma clé du bonheur et mon trésor de pirate sous mes jouets préférés.",
        "Je transforme ma chambre en jungle et mon lit en vaisseau spatial avec mes pouvoirs magiques.",
        "Je fabrique ma pâte à modeler vivante et mon slime parlant dans mes laboratoires secrets.",
        "J'ai perdu ma carte au trésor et mon compas magique dans mes poches dimensionnelles.",
        "Je déguste ma pizza aux vers de terre et mon sandwich aux araignées avec mes amis monstres.",
        "J'utilise ma loupe déformante et mon miroir grossissant pour observer mes insectes apprivoisés.",
        "J'ai rangé ma collection de peaux de serpent et mon bocal d'yeux de grenouille dans mes étagères.",
        "Je porte ma ceinture de champion et mon collier de dents sur mes vêtements de sorcier.",
        "Je prépare ma soupe de cailloux et mon bouillon d'herbe pour mes festins imaginaires.",
        "J'ai perdu ma baguette qui fait des bulles et mon chapeau à ressort dans mes aventures.",
        "Je range ma collection de chewing-gums mâchés et mon album de timbres magiques dans mes coffres.",
        "Je mélange ma poudre de rire et mon liquide de fou rire pour mes farces et attrapes.",
        "J'ai renversé ma potion de transformation et mon élixir de métamorphose sur mes chaussures.",
        "Je nourris ma plante carnivore et mon cactus dansant avec mes restes de repas.",
        "Je porte ma montre à remonter le temps et mon bracelet d'invisibilité lors de mes missions secrètes.",
        "J'ai caché ma boîte à malices et mon sac à surprises sous mon lit magique.",
        "Je prépare ma pâte à cookies empoisonnés et mon glaçage magique pour mes ennemis.",
        "J'utilise ma loupe magique et mon détecteur de trésors pour explorer mes territoires inconnus.",
        "J'ai perdu ma cape d'invisibilité et mon casque volant pendant mes escapades nocturnes.",
        "Je range ma collection de fossiles imaginaires et mon album de créatures fantastiques dans ma bibliothèque.",
        "Je mélange mon jus de crapaud et ma sauce aux mille-pattes pour mes pizzas spéciales.",
        "J'ai caché mon journal secret et ma boîte à souvenirs sous ma trappe invisible.",
        "Je porte ma ceinture anti-gravité et mon chapeau parapluie pendant mes explorations.",
        "Je prépare ma pâte à crêpes fluorescentes et mon sirop lumineux pour mes petits déjeuners magiques.",
        "J'ai perdu ma règle qui calcule toute seule et mon stylo à encre invisible dans mon cartable.",
        "Je range ma collection d'insectes parlants et mon vivarium de vers luisants dans ma chambre.",
        "Je mélange ma poudre qui pétille et mon liquide qui explose pour mes expériences scientifiques.",
        "J'ai caché ma clé des songes et mon attrape-cauchemars sous mon oreiller magique.",
        "Je porte ma ceinture multi-poches et mon gilet anti-taches pendant mes missions dangereuses.",
        "Je prépare ma pâte à modeler vivante et ma gelée bondissante pour mes sculptures animées.",
        "J'ai perdu ma boussole enchantée et ma carte mystérieuse dans la forêt interdite.",
        "Je range ma collection de plumes magiques et mon encrier sans fond dans mon bureau secret.",
        "Je mélange ma potion d'élasticité et mon philtre de rebondissement pour mes balles magiques.",
        "J'ai caché mon détecteur de mensonges et ma machine à rêves dans mon placard enchanté.",
        "Je porte ma cape de super-héros et mon masque d'invisibilité pendant mes aventures nocturnes.",
        "Je prépare ma soupe de crapauds volants et mon ragoût de limaces sauteuses pour mon dîner.",
        "J'ai perdu ma montre qui remonte le temps et mon calendrier qui prédit l'avenir dans ma chambre.",
        "Je range ma collection de pierres qui parlent et mon sac de sable magique dans mes tiroirs.",
        "Je mélange mon parfum de moufette et ma lotion de putois pour mes potions malodorantes.",
        "J'ai caché ma poudre qui fait éternuer et mon liquide qui fait tousser sous mon lit.",
        "Je porte ma couronne de roi des bêtises et mon sceptre des farces lors de mes cérémonies.",
        "Je prépare ma bouillie de chaussettes sales et mon jus de t-shirts usés pour mes potions.",
        "J'ai perdu ma craie qui dessine toute seule et mon pinceau qui peint en 3D dans mon atelier.",
        "Je range ma collection de boutons magiques et mon bocal de fils enchantés dans ma boîte à couture.",
        "Je mélange ma pâte à tartiner aux fourmis et ma confiture d'araignées pour mes goûters spéciaux.",
        "J'ai caché ma lampe qui montre l'invisible et mon miroir qui parle dans ma cachette secrète.",
        "Je porte ma chemise qui change de couleur et mon pantalon qui raccourcit tout seul à l'école.",
        "Je prépare ma soupe aux cailloux magiques et mon bouillon de bouts de bois pour mes amis imaginaires.",
        "J'ai perdu ma flûte qui hypnotise et mon tambour qui fait danser pendant la récréation.",
        "Je range ma collection de feuilles qui chantent et mon herbier magique dans mon laboratoire.",
        "Je mélange ma potion de sommeil et mon élixir de rêves pour mes nuits agitées.",
        "J'ai caché ma machine à voyager dans le temps et mon portail dimensionnel dans mon placard.",
        "Je porte ma ceinture anti-gravité et mon chapeau volant pendant mes expéditions.",
        "Je prépare ma gelée de chaussettes et mon smoothie aux élastiques pour mes goûters bizarres.",
        "J'ai perdu ma boule de cristal et mon pendule magique dans le grenier de mamie.",
        "Je range ma collection de bouteilles vides et mon sac de bouchons dans mon laboratoire.",
        "Je mélange ma poudre de disparition et mon liquide de réapparition pour mes tours de magie.",
        "J'ai caché ma cape de super vitesse et mon masque de vision nocturne sous mon tapis volant.",
        "Je porte ma veste à plumes et mon chapeau à ressort pendant mes spectacles de cirque.",
        "Je prépare ma soupe de boutons et mon ragoût d'élastiques pour mes poupées vivantes.",
        "J'ai perdu ma baguette qui fait pleuvoir et mon parapluie qui fait du vent dans le jardin.",
        "Je range ma collection de cartes magiques et mon jeu de dés pipés dans ma table de chevet.",
        "Je mélange mon parfum de moufette et ma lotion puante pour mes bombes à odeurs.",
        "J'ai caché ma potion de métamorphose et mon élixir de transformation dans mon armoire secrète.",
        "Je porte ma ceinture d'outils enchantés et mon tablier magique pendant mes bricolages.",
        "Je prépare ma tarte aux cailloux et mon gâteau de sable pour le goûter de mes poupées.",
        "J'ai perdu ma clé des contes et mon livre qui s'écrit tout seul dans la bibliothèque.",
        "Je range ma collection de chapeaux parlants et mes perruques changeantes dans ma malle.",
        "Je mélange ma poudre qui pique et mon liquide qui gratte pour mes potions de vengeance.",
        "J'ai caché ma boîte à musique ensorcelée et mon tambour silencieux dans ma tanière secrète.",
        "Je porte ma cape qui rend invisible et mes bottes qui marchent au plafond pendant la nuit.",
        "Je prépare ma potion de croissance instantanée et mon élixir de rétrécissement pour mes plantes.",
        "J'ai perdu ma carte du monde imaginaire et ma boussole qui ment dans ma chambre en désordre.",
        "Je range ma collection de peluches vivantes et mes marionnettes qui bougent toutes seules dans mon coffre.",
        "Je mélange ma poudre de cauchemars et mon sirop de beaux rêves pour mes expériences nocturnes.",
        "J'ai caché ma flûte enchantée et mon tambour magique sous mon lit pour éviter de réveiller mes parents.",
        "Je porte ma ceinture d'astronaute et mon casque de plongée pendant mes voyages imaginaires.",
        "Je prépare ma soupe aux crayons de couleur et mon ragoût de gommes pour nourrir mes dessins animés.",
        "J'ai perdu ma potion de force surhumaine et mon élixir de super intelligence dans mon cartable.",
        "Je range ma collection de clés mystérieuses et mon trousseau magique dans mon tiroir secret.",
        "Je mélange ma pâte de nuages et ma crème de ciel bleu pour mes desserts célestes.",
        "J'ai caché ma loupe qui voit à travers les murs et mes jumelles qui regardent dans le passé sous mon oreiller.",
        "Je porte ma montre qui arrête le temps et mon bracelet qui prédit l'avenir à l'école.",
        "Je prépare ma potion de fous rires et mon élixir de chatouilles pour mes farces de récréation.",
        "J'ai perdu ma baguette qui transforme en grenouille et mon grimoire des sorts interdits dans le grenier.",
        "Je range ma collection de dents de fée et mes écailles de dragon dans ma boîte à trésors.",
        "Je mélange ma poudre d'étoiles filantes et ma poussière de lune pour mes rituels nocturnes.",
        "J'ai caché ma peinture invisible et mes crayons magiques dans ma cachette sous l'escalier.",
        "Je porte ma ceinture de super-héros et mes gants qui collent aux murs pour sauver mes jouets.",
        "Je prépare mon pudding aux fourmis et ma gelée de scarabées pour le goûter de mes monstres.",
        "J'ai perdu ma pierre qui parle et mon caillou qui chante sur le chemin de l'école.",
        "Je range ma collection de nuages en bocaux et mes éclairs en bouteille dans mon laboratoire météo.",
        "Je mélange ma poudre de télépathie et mon liquide de lecture de pensées pour mes expériences.",
        "J'ai caché ma potion qui fait dire la vérité et mon sirop de mensonges dans ma mallette d'espion.",
        "Je porte ma cape anti-pluie et mon chapeau paratonnerre pendant mes aventures sous l'orage.",
        "Je prépare ma soupe d'arcs-en-ciel et mon bouillon d'aurores boréales pour mes festins célestes.",
        "J'ai perdu ma boussole qui trouve les trésors et ma lampe qui éclaire le passé dans la forêt enchantée.",
        "Je range ma collection de rêves en bouteilles et mes cauchemars apprivoisés dans ma table de nuit.",
        "Je mélange ma potion de super ouïe et mon élixir de vision nocturne pour mes missions d'espionnage.",
        "J'ai caché ma poudre qui rend invisible et mon liquide qui fait disparaître dans mon coffre à jouets.",
        "Je porte mes lunettes qui voient à travers les murs et mon casque qui entend les pensées pendant mes enquêtes.",
        "Je prépare ma glace aux épinards et mon sorbet aux petits pois pour mes goûters végétariens.",
        "J'ai perdu ma formule de téléportation et mon mode d'emploi pour voyager dans le temps dans mon sac.",
        "Je range ma collection de fantômes en bocal et mes spectres apprivoisés dans mon placard hanté."
    ];
    
    // Mélanger les phrases et en sélectionner 10 aléatoirement
    const shuffled = [...allPhrases].sort(() => 0.5 - Math.random());
    phrases = shuffled.slice(0, totalPhrases);
    
    // Calculer le score maximum possible
    phrases.forEach(phrase => {
        const maCount = (phrase.match(/\sma\s/g) || []).length;
        const monCount = (phrase.match(/\smon\s/g) || []).length;
        const mesCount = (phrase.match(/\smes\s/g) || []).length;
        maxScore += (maCount + monCount + mesCount) * 3;
    });
}

// Fonction pour afficher une phrase
function displayPhrase() {
    // Vider le contenu précédent
    phraseContentElement.innerHTML = '';
    
    // Récupérer la phrase actuelle
    const currentPhrase = phrases[currentPhraseIndex];
    
    // Remplacer les espaces par des espaces insécables pour éviter les problèmes de césure
    let words = currentPhrase.split(' ');
    
    // Compteur pour suivre le nombre de trous
    remainingHoles = 0;
    
    // Créer les éléments pour chaque mot
    words.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word';
        
        // Vérifier si le mot est "ma", "mon" ou "mes"
        // On vérifie aussi les versions avec ponctuation (ma, ma. ma, etc.)
        const cleanWord = word.replace(/[.,!?;:]$/, '');
        const punctuation = word.substring(cleanWord.length);
        
        if (cleanWord === 'ma' || cleanWord === 'mon' || cleanWord === 'mes') {
            // Créer un span pour le mot caché
            const wordSpan = document.createElement('span');
            wordSpan.textContent = cleanWord + punctuation;
            wordSpan.style.visibility = 'hidden';
            wordSpan.dataset.word = cleanWord;
            
            // Créer l'image du trou
            const holeImg = document.createElement('img');
            holeImg.src = '/assets/images/hole.webp';
            holeImg.className = 'hole';
            holeImg.dataset.word = cleanWord;
            holeImg.addEventListener('click', () => checkAnswer(holeImg, cleanWord));
            
            // Créer l'image pour afficher quand la réponse est fausse
            const wrongHoleImg = document.createElement('img');
            wrongHoleImg.src = '/assets/images/wrong_hole.webp';
            wrongHoleImg.className = 'wrong-hole';
            
            // Ajouter tous les éléments au mot
            wordElement.appendChild(wordSpan);
            wordElement.appendChild(holeImg);
            wordElement.appendChild(wrongHoleImg);
            
            // Incrémenter le compteur de trous
            remainingHoles++;
        } else {
            // Mot normal sans trou
            wordElement.textContent = word;
        }
        
        // Ajouter le mot au contenu de la phrase
        phraseContentElement.appendChild(wordElement);
    });
    
    // Ajuster la taille du texte après avoir affiché la phrase
    setTimeout(adjustTextSize, 50);
}


// Fonction pour sélectionner une option
function selectOption(option) {
    // Réinitialiser la sélection précédente
    optionMaElement.classList.remove('selected');
    optionMonElement.classList.remove('selected');
    optionMesElement.classList.remove('selected');
    
    // Mettre à jour l'option sélectionnée
    selectedOption = option;
    
    // Mettre en surbrillance l'option sélectionnée
    if (option === 'ma') {
        optionMaElement.classList.add('selected');
    } else if (option === 'mon') {
        optionMonElement.classList.add('selected');
    } else if (option === 'mes') {
        optionMesElement.classList.add('selected');
    }
}

// Fonction pour vérifier la réponse
function checkAnswer(holeElement, correctWord) {
    // Vérifier si une option a été sélectionnée
    if (!selectedOption) {
        return;
    }
    
    // Vérifier si la réponse est correcte
    if (selectedOption === correctWord) {
        // Réponse correcte
        // Supprimer le trou
        holeElement.style.display = 'none';
        
        // Rendre le mot visible
        const wordSpan = holeElement.previousSibling;
        wordSpan.style.visibility = 'visible';
        
        // Ajouter des points
        currentScore += 3;
        
        // Mettre à jour le score dans l'interface
        updatetopbar_score(currentScore);
        
        // Décrémenter le nombre de trous restants
        remainingHoles--;
        
        // Vérifier si tous les trous ont été complétés
        if (remainingHoles === 0) {
            // Passer à la phrase suivante ou terminer le jeu
            nextPhrase();
        }
    } else {
        // Réponse incorrecte
        // Faire clignoter l'image d'erreur
        const wrongHoleImg = holeElement.nextSibling;
        wrongHoleImg.style.display = 'block';
        
        // Enlever des points
        currentScore = Math.max(0, currentScore - 5);
        
        // Mettre à jour le score dans l'interface
        updatetopbar_score(currentScore);
        
        // Faire clignoter l'image d'erreur
        setTimeout(() => {
            wrongHoleImg.style.display = 'none';
            setTimeout(() => {
                wrongHoleImg.style.display = 'block';
                setTimeout(() => {
                    wrongHoleImg.style.display = 'none';
                }, 250);
            }, 250);
        }, 250);
    }
    
    // Réinitialiser l'option sélectionnée
    selectedOption = null;
    optionMaElement.classList.remove('selected');
    optionMonElement.classList.remove('selected');
    optionMesElement.classList.remove('selected');
}

// Fonction pour passer à la phrase suivante
function nextPhrase() {
    // Incrémenter l'index de la phrase
    currentPhraseIndex++;
    
    // Vérifier si le jeu est terminé
    if (currentPhraseIndex >= totalPhrases) {
        // Terminer le jeu
        endGameWithResults();
    } else {
        // Afficher la phrase suivante
        setTimeout(() => {
            displayPhrase();
            // Réajuster la taille du texte pour la nouvelle phrase
            adjustTextSize();
        }, 1000);
    }
}

// Fonction pour terminer le jeu (OBLIGATOIRE)
function endGameWithResults() {
    // Calculer le temps écoulé
    const timeSpent = Math.ceil((Date.now() - gameStartTime) / 1000);
    
    // Appeler la fonction endGame du template
    window.GameEnd.endGame({
        score: currentScore,
        maxScore: maxScore,
        timeSpent: timeSpent
    }, resetGame);
}

// Fonction de réinitialisation du jeu (OBLIGATOIRE)
function resetGame() {
    // Réinitialiser les variables du jeu
    currentPhraseIndex = 0;
    currentScore = 0;
    gameStartTime = Date.now();
    selectedOption = null;
    
    // Mélanger à nouveau les phrases
    generatePhrases();
    
    // Mettre à jour le score dans l'interface
    updatetopbar_score(currentScore);
    
    // Afficher la première phrase
    displayPhrase();
}