// Fichier de configuration pour blockMap et heightMap

// ===== Système de blocage (blockMap) =====
let blockMap = {};
for (let x = 0; x < 80; x++) {
  for (let y = 0; y < 80; y++) {
    blockMap[x + "," + y] = false;
  }
}

// Exemple de configuration : blocage de certaines zones
for (let x = 22; x < 49; x++) {
  for (let y = 24; y < 35; y++) {
    blockMap[x + "," + y] = true;
  }
}
for (let x = 32; x < 38; x++) {
  for (let y = 35; y < 38; y++) {
    blockMap[x + "," + y] = true;
  }
}
for (let x = 27; x < 31; x++) {
  for (let y = 39; y < 41; y++) {
    blockMap[x + "," + y] = true;
  }
}
for (let x = 45; x < 49; x++) {
  for (let y = 38; y < 40; y++) {
    blockMap[x + "," + y] = true;
  }
}
// (Ajoutez ici d'autres configurations de blocage selon vos besoins)

// ===== Système de hauteur (heightMap) =====
// Par défaut, chaque tuile a une hauteur de 0.
let heightMap = {};
for (let x = 0; x < 80; x++) {
  for (let y = 0; y < 80; y++) {
    heightMap[x + "," + y] = 0;
  }
}

// Exemple de configuration : définir certaines zones en hauteur 2
for (let x = 22; x < 49; x++) {
  for (let y = 24; y < 35; y++) {
    // Par exemple, ici on peut laisser la hauteur par défaut si désiré
  }
}

    ///////////////// ECOLE ////////////////////////
    for(let x = 22; x < 49; x++){
      for(let y = 24; y < 35; y++){
        blockMap[x + ',' + y] = true;
      }
    }
for(let x = 0; x < 25; x++){
      for(let y = 1; y < 14; y++){
        abs = 23+x-y;
        ord = 24-y;
        heightMap[abs + ',' + ord] = 2;
      }
    }
for(let y = 0; y < 10; y++){
      for(let z = 0; z < 13; z++){
        abs = 22-z;
        ord = 24+y-z;
        heightMap[abs + ',' + ord] = 2;
      }
    }

    // Ecole marches
    for(let x = 32; x < 38; x++){
      for(let y = 35; y < 38; y++){
        blockMap[x + "," + y] = true;
      }
    }


    //Banc école
    for(let x = 27; x < 31; x++){
      for(let y = 39; y < 41; y++){
        blockMap[x + ',' + y] = true;
      }
    }
for(let x = 0; x < 3; x++){
      for(let y = 1; y < 3; y++){
        abs = 28+x-y;
        ord = 39-y;
        heightMap[abs + ',' + ord] = 2;
      }
    }
for(let y = 0; y < 2; y++){
      for(let z = 0; z < 2; z++){
        abs = 27-z;
        ord = 39+y-z;
        heightMap[abs + ',' + ord] = 2;
      }
    }

    //Banc école 2
    for(let x = 45; x < 49; x++){
      for(let y = 38; y < 40; y++){
        blockMap[x + ',' + y] = true;
      }
    }
for(let x = 0; x < 3; x++){
      for(let y = 1; y < 3; y++){
        abs = 46+x-y;
        ord = 38-y;
        heightMap[abs + ',' + ord] = 2;
      }
    }
for(let y = 0; y < 2; y++){
      for(let z = 0; z < 2; z++){
        abs = 45-z;
        ord = 38+y-z;
        heightMap[abs + ',' + ord] = 2;
      }
    }

    //Banc nord
    for(let x = 9; x < 14; x++){
      for(let y = 27; y < 29; y++){
        blockMap[x + ',' + y] = true;
      }
    }
for(let x = 0; x < 4; x++){
      for(let y = 1; y < 2; y++){
        abs = 10+x-y;
        ord = 27-y;
        heightMap[abs + ',' + ord] = 2;
      }
    }
for(let y = 0; y < 2; y++){
      for(let z = 0; z < 1; z++){
        abs = 9-z;
        ord = 27+y-z;
        heightMap[abs + ',' + ord] = 2;
      }
    }

    //Banc ouest
    for(let x = 11; x < 15; x++){
      for(let y = 55; y < 57; y++){
        blockMap[x + ',' + y] = true;
      }
    }
for(let x = 0; x < 3; x++){
      for(let y = 1; y < 3; y++){
        abs = 12+x-y;
        ord = 55-y;
        heightMap[abs + ',' + ord] = 2;
      }
    }
for(let y = 0; y < 2; y++){
      for(let z = 0; z < 2; z++){
        abs = 11-z;
        ord = 55+y-z;
        heightMap[abs + ',' + ord] = 2;
      }
    }

    //Banc mid
    for(let x = 47; x < 52; x++){
      for(let y = 52; y < 54; y++){
        blockMap[x + ',' + y] = true;
      }
    }
for(let x = 0; x < 4; x++){
      for(let y = 1; y < 3; y++){
        abs = 48+x-y;
        ord = 52-y;
        heightMap[abs + ',' + ord] = 2;
      }
    }
for(let y = 0; y < 2; y++){
      for(let z = 0; z < 2; z++){
        abs = 47-z;
        ord = 52+y-z;
        heightMap[abs + ',' + ord] = 2;
      }
    }

    //Playground
    for(let y = 36; y < 45; y++){
        blockMap[58 + ',' + y] = true;
    }
    for(let y = 36; y < 45; y++){
        blockMap[59 + ',' + y] = true;
    }
    for(let y = 36; y < 45; y++){
        blockMap[60 + ',' + y] = true;
    }
    for(let y = 36; y < 45; y++){
        blockMap[61 + ',' + y] = true;
    }
    for(let y = 36; y < 40; y++){
        blockMap[62 + ',' + y] = true;
    }
    for(let y = 36; y < 40; y++){
        blockMap[63 + ',' + y] = true;
    }
    for(let y = 36; y < 38; y++){
        blockMap[64 + ',' + y] = true;
    }
    for(let y = 37; y < 38; y++){
        blockMap[65 + ',' + y] = true;
    }

    for(let x = 61; x < 65; x++){
        blockMap[x + ',' + 32] = true;
    }
    for(let x = 61; x < 65; x++){
        blockMap[x + ',' + 33] = true;
    }

    for(let x = 66; x < 69; x++){
        blockMap[x + ',' + 32] = true;
    }
    for(let x = 66; x < 69; x++){
        blockMap[x + ',' + 33] = true;
    }
    for(let x = 66; x < 69; x++){
        blockMap[x + ',' + 30] = true;
    }
    for(let x = 66; x < 69; x++){
        blockMap[x + ',' + 31] = true;
    }
    for(let x = 66; x < 69; x++){
        blockMap[x + ',' + 29] = true;
    }

    for(let x = 65; x < 69; x++){
      for(let y = 41; y < 44; y++){
        blockMap[x + ',' + y] = true;
      }
    }
    for(let x = 56; x < 65; x++){
        
        heightMap[x + ',' + 35] = 2;
    
        heightMap[x + ',' + 36] = 2;
    }
    for(let x = 55; x < 62; x++){
        heightMap[x + ',' + 34] = 2;        
    }
    for(let x = 53; x < 61; x++){
        heightMap[x + ',' + 33] = 2; 
        heightMap[x + ',' + 32] = 2;    
    }
    heightMap[57 + ',' + 31] = 2;
    for(let x = 52; x < 57; x++){
        heightMap[x + ',' + 31] = 2; 
        heightMap[x + ',' + 30] = 2;   
        heightMap[x + ',' + 29] = 2;
    }
    for(let x = 59; x < 64; x++){
        heightMap[x + ',' + 31] = 2; 
        heightMap[x + ',' + 30] = 2;   
        heightMap[x + ',' + 29] = 2;
    }
    for(let x = 8; x < 42; x++){
        blockMap[x + ',' + 16] = true;
    }
    for(let y = 17; y < 27; y++){
        blockMap[8 + ',' + y] = true;
    }
    for(let y = 28; y < 57; y++){
        blockMap[6 + ',' + y] = true;
    }
    for(let y = 25; y < 36; y++){
        heightMap[71 + ',' + y] = 2;
    }
    for(let y = 26; y < 45; y++){
        heightMap[72 + ',' + y] = 2;
    }
    for(let y = 27; y < 54; y++){
        heightMap[73 + ',' + y] = 2;
    }
    for(let y = 31; y < 65; y++){
        heightMap[74 + ',' + y] = 2;
    }
    for(let y = 40; y < 68; y++){
        heightMap[75 + ',' + y] = 2;
    }
    for(let y = 50; y < 67; y++){
        heightMap[76 + ',' + y] = 2;
    }
    for(let y = 59; y < 66; y++){
        heightMap[77 + ',' + y] = 2;
    }
    for(let x = 59; x < 68; x++){
        heightMap[x + ',' + 75] = 2;
    }
    for(let x = 51; x < 69; x++){
        heightMap[x + ',' + 74] = 2;
    }
    for(let x = 42; x < 70; x++){
        heightMap[x + ',' + 73] = 2;
    }
    for(let x = 34; x < 69; x++){
        heightMap[x + ',' + 72] = 2;
    }
    for(let x = 24; x < 59; x++){
        heightMap[x + ',' + 71] = 2;
    }
    for(let x = 23; x < 51; x++){
        heightMap[x + ',' + 70] = 2;
    }
    for(let x = 22; x < 45; x++){
        heightMap[x + ',' + 69] = 2;
    }
    for(let x = 21; x < 45; x++){
        heightMap[x + ',' + 68] = 2;
    }
    for(let x = 37; x < 40; x++){
        heightMap[x + ',' + 67] = 2;
    }

    heightMap[57+','+37] = 2;
 heightMap[56+','+37] = 2;
 heightMap[57+','+38] = 2;
 heightMap[57+','+39] = 2;
 heightMap[56+','+38] = 2;
 heightMap[55+','+35] = 2;
 heightMap[58+','+31] = 2;
 heightMap[58+','+30] = 2;
 heightMap[58+','+29] = 2;
 heightMap[64+','+31] = 2;
 heightMap[65+','+31] = 2;
 heightMap[65+','+32] = 2;
 heightMap[65+','+30] = 2;
 heightMap[64+','+29] = 2;
 heightMap[65+','+29] = 2;
 heightMap[65+','+28] = 2;
 heightMap[64+','+28] = 2;
 heightMap[63+','+28] = 2;
 heightMap[63+','+27] = 2;
 heightMap[62+','+27] = 2;
 heightMap[62+','+26] = 2;
 heightMap[61+','+26] = 2;
 heightMap[61+','+25] = 2;
 heightMap[62+','+25] = 2;
 heightMap[63+','+25] = 2;
 heightMap[64+','+25] = 2;
 heightMap[65+','+26] = 2;
 heightMap[65+','+27] = 2;
 heightMap[66+','+27] = 2;
 heightMap[67+','+28] = 2;
 heightMap[66+','+28] = 2;
blockMap[59+','+27] = true;
blockMap[58+','+27] = true;
blockMap[57+','+27] = true;
blockMap[56+','+27] = true;
blockMap[55+','+27] = true;
blockMap[54+','+27] = true;
blockMap[54+','+26] = true;
blockMap[55+','+26] = true;
blockMap[56+','+26] = true;
blockMap[57+','+26] = true;
blockMap[58+','+26] = true;
blockMap[59+','+26] = true;
blockMap[59+','+25] = true;
blockMap[58+','+25] = true;
blockMap[57+','+25] = true;
blockMap[56+','+25] = true;
blockMap[55+','+25] = true;
blockMap[54+','+25] = true;
blockMap[54+','+24] = true;
blockMap[55+','+24] = true;
blockMap[56+','+24] = true;
blockMap[57+','+24] = true;
blockMap[58+','+24] = true;
blockMap[59+','+24] = true;
 heightMap[59+','+23] = 2;
 heightMap[58+','+23] = 2;
 heightMap[57+','+23] = 2;
 heightMap[56+','+23] = 2;
 heightMap[55+','+23] = 2;
 heightMap[54+','+23] = 2;
 heightMap[53+','+23] = 2;
 heightMap[52+','+23] = 2;
 heightMap[51+','+23] = 2;
 heightMap[50+','+23] = 2;
 heightMap[50+','+22] = 2;
 heightMap[51+','+22] = 2;
 heightMap[52+','+22] = 2;
 heightMap[53+','+22] = 2;
 heightMap[54+','+22] = 2;
 heightMap[55+','+22] = 2;
 heightMap[56+','+22] = 2;
 heightMap[57+','+22] = 2;
 heightMap[58+','+22] = 2;
 heightMap[57+','+21] = 2;
 heightMap[56+','+21] = 2;
 heightMap[55+','+21] = 2;
 heightMap[54+','+21] = 2;
 heightMap[53+','+21] = 2;
 heightMap[52+','+21] = 2;
 heightMap[51+','+21] = 2;
 heightMap[50+','+21] = 2;
 heightMap[49+','+21] = 2;
 heightMap[48+','+20] = 2;
 heightMap[49+','+20] = 2;
 heightMap[50+','+20] = 2;
 heightMap[51+','+20] = 2;
 heightMap[52+','+20] = 2;
 heightMap[53+','+20] = 2;
 heightMap[54+','+20] = 2;
 heightMap[55+','+20] = 2;
 heightMap[54+','+19] = 2;
 heightMap[53+','+19] = 2;
 heightMap[52+','+19] = 2;
 heightMap[51+','+19] = 2;
 heightMap[50+','+19] = 2;
 heightMap[49+','+19] = 2;
 heightMap[48+','+19] = 2;
 heightMap[49+','+22] = 2;
 heightMap[51+','+24] = 2;
 heightMap[52+','+24] = 2;
 heightMap[53+','+24] = 2;
 heightMap[53+','+25] = 2;
 heightMap[52+','+25] = 2;
 heightMap[53+','+26] = 2;
 heightMap[53+','+27] = 2;
blockMap[53+','+24] = true;
blockMap[53+','+25] = true;
blockMap[53+','+26] = true;
blockMap[53+','+27] = true;
 heightMap[63+','+26] = 2;
 heightMap[64+','+27] = 2;
 heightMap[64+','+26] = 2;
 heightMap[66+','+25] = 2;
 heightMap[67+','+26] = 2;
 heightMap[68+','+26] = 2;
 heightMap[68+','+25] = 2;
 heightMap[67+','+25] = 2;
 heightMap[65+','+24] = 2;
 heightMap[66+','+24] = 2;
 heightMap[67+','+24] = 2;
 heightMap[68+','+24] = 2;
 heightMap[67+','+23] = 2;
 heightMap[66+','+23] = 2;
 heightMap[65+','+23] = 2;
blockMap[70+','+23] = true;
blockMap[69+','+22] = true;
blockMap[68+','+21] = true;
blockMap[67+','+20] = true;
blockMap[66+','+19] = true;
 heightMap[66+','+20] = 2;
 heightMap[65+','+19] = 2;
blockMap[65+','+18] = true;
blockMap[64+','+17] = true;
blockMap[63+','+16] = true;
blockMap[62+','+16] = true;
blockMap[62+','+20] = true;
blockMap[61+','+20] = true;
 heightMap[61+','+19] = 2;
 heightMap[60+','+19] = 2;
 heightMap[59+','+19] = 2;
 heightMap[58+','+19] = 2;
 heightMap[58+','+18] = 2;
 heightMap[57+','+18] = 2;
 heightMap[57+','+17] = 2;
 heightMap[58+','+17] = 2;
 heightMap[59+','+17] = 2;
 heightMap[60+','+17] = 2;
 heightMap[44+','+18] = 2;
 heightMap[45+','+18] = 2;
 heightMap[45+','+17] = 2;
 heightMap[44+','+17] = 2;
 heightMap[43+','+17] = 2;
 heightMap[42+','+16] = 2;
blockMap[42+','+16] = true;
blockMap[43+','+16] = true;
blockMap[44+','+16] = true;
blockMap[45+','+16] = true;
blockMap[46+','+16] = true;
blockMap[47+','+16] = true;
blockMap[48+','+16] = true;
blockMap[49+','+16] = true;
blockMap[50+','+16] = true;
blockMap[51+','+16] = true;
blockMap[52+','+16] = true;
blockMap[53+','+16] = true;
blockMap[54+','+16] = true;
blockMap[55+','+16] = true;
blockMap[56+','+16] = true;
blockMap[57+','+16] = true;
 heightMap[64+','+30] = 2;
 heightMap[59+','+18] = 2;
heightMap[60+','+18] = 2;
heightMap[61+','+18] = 2;
blockMap[61+','+19] = true;
blockMap[62+','+19] = true;
heightMap[67+','+56] = 2;
heightMap[68+','+56] = 2;
heightMap[69+','+55] = 2;
heightMap[68+','+55] = 2;
heightMap[67+','+55] = 2;
heightMap[66+','+55] = 2;
heightMap[65+','+54] = 2;
heightMap[66+','+54] = 2;
heightMap[67+','+54] = 2;
heightMap[68+','+54] = 2;
heightMap[68+','+53] = 2;
heightMap[67+','+53] = 2;
heightMap[66+','+53] = 2;
heightMap[65+','+53] = 2;
heightMap[71+','+63] = 2;
heightMap[70+','+63] = 2;
heightMap[69+','+62] = 2;
heightMap[70+','+62] = 2;
heightMap[71+','+62] = 2;
heightMap[72+','+62] = 2;
heightMap[72+','+61] = 2;
heightMap[71+','+61] = 2;
heightMap[70+','+61] = 2;
heightMap[69+','+61] = 2;
heightMap[69+','+60] = 2;
heightMap[70+','+60] = 2;
heightMap[71+','+60] = 2;
blockMap[64+','+61] = true;
blockMap[65+','+61] = true;
blockMap[65+','+60] = true;
blockMap[64+','+60] = true;
blockMap[64+','+59] = true;
blockMap[65+','+59] = true;
heightMap[63+','+59] = 2;
heightMap[64+','+59] = 2;
heightMap[63+','+58] = 2;
heightMap[62+','+58] = 2;
heightMap[61+','+58] = 2;
heightMap[60+','+58] = 2;
heightMap[59+','+58] = 2;
heightMap[58+','+57] = 2;
heightMap[59+','+57] = 2;
heightMap[60+','+57] = 2;
heightMap[61+','+57] = 2;
heightMap[62+','+57] = 2;
heightMap[63+','+57] = 2;
heightMap[63+','+56] = 2;
heightMap[62+','+56] = 2;
heightMap[61+','+56] = 2;
heightMap[60+','+56] = 2;
heightMap[59+','+56] = 2;
heightMap[58+','+56] = 2;
heightMap[57+','+56] = 2;
heightMap[56+','+55] = 2;
heightMap[57+','+55] = 2;
heightMap[58+','+55] = 2;
heightMap[59+','+55] = 2;
heightMap[60+','+55] = 2;
heightMap[61+','+55] = 2;
heightMap[62+','+55] = 2;
heightMap[62+','+54] = 2;
heightMap[61+','+54] = 2;
heightMap[60+','+54] = 2;
heightMap[59+','+54] = 2;
heightMap[58+','+54] = 2;
heightMap[57+','+54] = 2;
heightMap[56+','+54] = 2;
heightMap[55+','+53] = 2;
heightMap[56+','+53] = 2;
heightMap[57+','+53] = 2;
heightMap[58+','+53] = 2;
heightMap[59+','+53] = 2;
heightMap[60+','+53] = 2;
heightMap[61+','+53] = 2;
heightMap[60+','+52] = 2;
heightMap[59+','+52] = 2;
heightMap[58+','+52] = 2;
heightMap[57+','+52] = 2;
heightMap[56+','+52] = 2;
heightMap[55+','+52] = 2;
heightMap[55+','+51] = 2;
heightMap[56+','+51] = 2;
heightMap[57+','+51] = 2;
heightMap[58+','+51] = 2;
blockMap[67+','+70] = true;
blockMap[68+','+70] = true;
blockMap[68+','+69] = true;
blockMap[67+','+69] = true;
heightMap[67+','+68] = 2;
heightMap[66+','+68] = 2;
heightMap[65+','+68] = 2;
heightMap[64+','+68] = 2;
heightMap[63+','+67] = 2;
heightMap[64+','+67] = 2;
heightMap[65+','+67] = 2;
heightMap[66+','+67] = 2;
heightMap[67+','+67] = 2;
heightMap[67+','+66] = 2;
heightMap[66+','+66] = 2;
heightMap[65+','+66] = 2;
heightMap[64+','+66] = 2;
heightMap[63+','+66] = 2;
heightMap[63+','+65] = 2;
heightMap[64+','+65] = 2;
heightMap[65+','+65] = 2;
heightMap[59+','+62] = 2;
heightMap[58+','+62] = 2;
heightMap[57+','+61] = 2;
heightMap[58+','+61] = 2;
heightMap[59+','+61] = 2;
heightMap[59+','+60] = 2;
heightMap[58+','+60] = 2;
heightMap[57+','+60] = 2;
heightMap[57+','+59] = 2;
heightMap[58+','+59] = 2;
heightMap[53+','+60] = 2;
heightMap[54+','+60] = 2;
heightMap[52+','+59] = 2;
heightMap[53+','+59] = 2;
heightMap[54+','+59] = 2;
heightMap[54+','+58] = 2;
heightMap[53+','+58] = 2;
heightMap[52+','+58] = 2;
heightMap[51+','+58] = 2;
blockMap[60+','+69] = true;
blockMap[60+','+68] = true;
heightMap[59+','+68] = 2;
heightMap[58+','+68] = 2;
heightMap[57+','+68] = 2;
heightMap[56+','+67] = 2;
heightMap[57+','+67] = 2;
heightMap[58+','+67] = 2;
heightMap[59+','+67] = 2;
heightMap[59+','+66] = 2;
heightMap[58+','+66] = 2;
heightMap[57+','+66] = 2;
heightMap[56+','+66] = 2;
heightMap[55+','+66] = 2;
heightMap[54+','+65] = 2;
heightMap[55+','+65] = 2;
heightMap[56+','+65] = 2;
heightMap[57+','+65] = 2;
heightMap[58+','+65] = 2;
heightMap[58+','+64] = 2;
heightMap[57+','+64] = 2;
heightMap[56+','+64] = 2;
heightMap[55+','+64] = 2;
heightMap[54+','+64] = 2;
heightMap[54+','+63] = 2;
heightMap[55+','+63] = 2;
heightMap[56+','+63] = 2;
heightMap[57+','+63] = 2;
heightMap[51+','+67] = 2;
heightMap[52+','+67] = 2;
heightMap[50+','+66] = 2;
heightMap[51+','+66] = 2;
heightMap[52+','+66] = 2;
heightMap[52+','+65] = 2;
heightMap[51+','+65] = 2;
heightMap[50+','+65] = 2;
heightMap[49+','+65] = 2;
heightMap[49+','+64] = 2;
heightMap[50+','+64] = 2;
heightMap[51+','+64] = 2;
blockMap[47+','+60] = true;
blockMap[48+','+60] = true;
blockMap[49+','+60] = true;
blockMap[49+','+59] = true;
blockMap[48+','+59] = true;
blockMap[47+','+59] = true;
blockMap[47+','+58] = true;
blockMap[48+','+58] = true;
heightMap[47+','+58] = 2;
heightMap[46+','+58] = 2;
heightMap[45+','+58] = 2;
heightMap[43+','+57] = 2;
heightMap[44+','+57] = 2;
heightMap[45+','+57] = 2;
heightMap[46+','+57] = 2;
heightMap[46+','+56] = 2;
heightMap[45+','+56] = 2;
heightMap[44+','+56] = 2;
heightMap[43+','+56] = 2;
heightMap[42+','+56] = 2;
heightMap[41+','+55] = 2;
heightMap[42+','+55] = 2;
heightMap[43+','+55] = 2;
heightMap[44+','+55] = 2;
heightMap[45+','+55] = 2;
heightMap[46+','+55] = 2;
heightMap[46+','+54] = 2;
heightMap[45+','+54] = 2;
heightMap[44+','+54] = 2;
heightMap[43+','+54] = 2;
heightMap[42+','+54] = 2;
heightMap[41+','+54] = 2;
heightMap[40+','+53] = 2;
heightMap[41+','+53] = 2;
heightMap[42+','+53] = 2;
heightMap[43+','+53] = 2;
heightMap[44+','+53] = 2;
heightMap[45+','+53] = 2;
heightMap[43+','+52] = 2;
heightMap[42+','+52] = 2;
heightMap[41+','+52] = 2;
heightMap[40+','+52] = 2;
blockMap[25+','+43] = true;
blockMap[26+','+43] = true;
blockMap[26+','+42] = true;
blockMap[25+','+42] = true;
heightMap[24+','+41] = 2;
heightMap[23+','+41] = 2;
heightMap[22+','+41] = 2;
heightMap[21+','+41] = 2;
heightMap[20+','+40] = 2;
heightMap[21+','+40] = 2;
heightMap[22+','+40] = 2;
heightMap[23+','+40] = 2;
heightMap[24+','+40] = 2;
heightMap[24+','+39] = 2;
heightMap[23+','+39] = 2;
heightMap[22+','+39] = 2;
heightMap[21+','+39] = 2;
heightMap[20+','+39] = 2;
heightMap[19+','+39] = 2;
heightMap[19+','+38] = 2;
heightMap[20+','+38] = 2;
heightMap[21+','+38] = 2;
heightMap[22+','+38] = 2;
heightMap[23+','+38] = 2;
heightMap[23+','+37] = 2;
heightMap[22+','+37] = 2;
heightMap[21+','+37] = 2;
heightMap[20+','+37] = 2;
heightMap[19+','+37] = 2;
heightMap[19+','+36] = 2;
heightMap[20+','+36] = 2;
heightMap[21+','+36] = 2;
blockMap[27+','+69] = true;
blockMap[27+','+70] = true;
blockMap[28+','+70] = true;
blockMap[28+','+69] = true;
heightMap[27+','+68] = 2;
heightMap[26+','+68] = 2;
heightMap[25+','+68] = 2;
heightMap[24+','+68] = 2;
heightMap[23+','+68] = 2;
heightMap[22+','+67] = 2;
heightMap[23+','+67] = 2;
heightMap[24+','+67] = 2;
heightMap[25+','+67] = 2;
heightMap[26+','+67] = 2;
heightMap[26+','+66] = 2;
heightMap[25+','+66] = 2;
heightMap[24+','+66] = 2;
heightMap[23+','+66] = 2;
heightMap[22+','+66] = 2;
heightMap[21+','+66] = 2;
heightMap[20+','+65] = 2;
heightMap[21+','+65] = 2;
heightMap[22+','+65] = 2;
heightMap[23+','+65] = 2;
heightMap[24+','+65] = 2;
heightMap[25+','+65] = 2;
heightMap[26+','+65] = 2;
heightMap[25+','+64] = 2;
heightMap[24+','+64] = 2;
heightMap[23+','+64] = 2;
heightMap[22+','+64] = 2;
heightMap[21+','+64] = 2;
heightMap[20+','+64] = 2;
heightMap[19+','+63] = 2;
heightMap[20+','+63] = 2;
heightMap[21+','+63] = 2;
heightMap[22+','+63] = 2;
heightMap[23+','+63] = 2;
heightMap[24+','+63] = 2;
heightMap[23+','+62] = 2;
heightMap[22+','+62] = 2;
heightMap[21+','+62] = 2;
heightMap[20+','+62] = 2;
heightMap[19+','+62] = 2;
heightMap[20+','+61] = 2;
heightMap[21+','+61] = 2;
heightMap[16+','+62] = 2;
heightMap[17+','+62] = 2;
heightMap[15+','+62] = 2;
heightMap[14+','+61] = 2;
heightMap[15+','+61] = 2;
heightMap[16+','+61] = 2;
heightMap[17+','+61] = 2;
heightMap[17+','+60] = 2;
heightMap[16+','+60] = 2;
heightMap[15+','+60] = 2;
heightMap[14+','+60] = 2;
heightMap[14+','+59] = 2;
heightMap[15+','+59] = 2;
heightMap[16+','+59] = 2;
blockMap[18+','+67] = true;
blockMap[17+','+66] = true;
blockMap[16+','+65] = true;
blockMap[15+','+64] = true;
blockMap[14+','+63] = true;
blockMap[13+','+62] = true;
blockMap[12+','+61] = true;
blockMap[11+','+60] = true;
blockMap[10+','+59] = true;
blockMap[9+','+58] = true;
blockMap[8+','+57] = true;
blockMap[7+','+56] = true;
heightMap[8+','+56] = 2;
heightMap[9+','+57] = 2;
heightMap[10+','+58] = 2;
heightMap[11+','+59] = 2;
heightMap[12+','+60] = 2;
heightMap[11+','+58] = 2;
heightMap[10+','+57] = 2;
heightMap[9+','+56] = 2;
blockMap[7+','+30] = true;
blockMap[7+','+29] = true;
blockMap[8+','+30] = true;
blockMap[8+','+29] = true;
blockMap[8+','+28] = true;
blockMap[7+','+28] = true;
blockMap[8+','+27] = true;
blockMap[7+','+27] = true;
blockMap[6+','+27] = true;
blockMap[63+','+61] = true;
blockMap[63+','+60] = true;
blockMap[63+','+59] = true;
blockMap[66+','+70] = true;
blockMap[66+','+69] = true;
blockMap[59+','+69] = true;
blockMap[59+','+68] = true;
 heightMap[49+','+63] = 2;
 heightMap[50+','+63] = 2;
 heightMap[52+','+64] = 2;
 heightMap[53+','+66] = 2;
 heightMap[40+','+54] = 2;
 heightMap[40+','+51] = 2;
 heightMap[41+','+51] = 2;
 heightMap[42+','+51] = 2;
 heightMap[43+','+51] = 2;
 heightMap[44+','+52] = 2;
 heightMap[65+','+52] = 2;
 heightMap[66+','+52] = 2;
 heightMap[69+','+56] = 2;
 heightMap[61+','+24] = 2;
 heightMap[62+','+24] = 2;
 heightMap[63+','+24] = 2;
 heightMap[67+','+21] = 2;
blockMap[61+','+16] = true;
blockMap[60+','+16] = true;
blockMap[59+','+16] = true;
blockMap[58+','+16] = true;
 heightMap[56+','+17] = 2;
 heightMap[46+','+17] = 2;
 heightMap[46+','+18] = 2;
 heightMap[22+','+42] = 2;
heightMap[23+','+42] = 2;
heightMap[24+','+42] = 2;
heightMap[24+','+38] = 2;
heightMap[22+','+36] = 2;
 blockMap[7+','+44] = true;
 blockMap[7+','+43] = true;
heightMap[27+','+67] = 2;
heightMap[27+','+66] = 2;
heightMap[25+','+63] = 2;
heightMap[24+','+62] = 2;
heightMap[22+','+61] = 2;
heightMap[19+','+61] = 2;
heightMap[19+','+64] = 2;
heightMap[44+','+58] = 2;
heightMap[47+','+56] = 2;
heightMap[47+','+57] = 2;
heightMap[54+','+62] = 2;
heightMap[55+','+62] = 2;
heightMap[56+','+62] = 2;
heightMap[57+','+62] = 2;
heightMap[51+','+57] = 2;
heightMap[52+','+57] = 2;
heightMap[53+','+57] = 2;
 blockMap[45+','+43] = true;
 blockMap[46+','+43] = true;
 blockMap[46+','+42] = true;
 blockMap[45+','+42] = true;
heightMap[42+','+42] = 2;
heightMap[43+','+42] = 2;
heightMap[44+','+42] = 2;
heightMap[45+','+42] = 2;
heightMap[41+','+41] = 2;
heightMap[42+','+41] = 2;
heightMap[43+','+41] = 2;
heightMap[44+','+41] = 2;
heightMap[45+','+41] = 2;
heightMap[45+','+40] = 2;
heightMap[44+','+40] = 2;
heightMap[43+','+40] = 2;
heightMap[42+','+40] = 2;
heightMap[41+','+40] = 2;
heightMap[40+','+40] = 2;
heightMap[40+','+39] = 2;
heightMap[41+','+39] = 2;
heightMap[42+','+39] = 2;
heightMap[43+','+39] = 2;
heightMap[44+','+39] = 2;
heightMap[43+','+38] = 2;
heightMap[42+','+38] = 2;
heightMap[41+','+38] = 2;
heightMap[40+','+38] = 2;
heightMap[40+','+37] = 2;
heightMap[41+','+37] = 2;
heightMap[42+','+37] = 2;
 blockMap[29+','+35] = true;
 blockMap[30+','+35] = true;
 blockMap[31+','+35] = true;
 blockMap[38+','+35] = true;
 blockMap[39+','+35] = true;
 blockMap[40+','+35] = true;
 blockMap[71+','+24] = true;
 blockMap[72+','+25] = true;
 blockMap[73+','+26] = true;
 blockMap[74+','+27] = true;
 blockMap[74+','+28] = true;
 blockMap[74+','+29] = true;
 blockMap[74+','+30] = true;
 blockMap[75+','+31] = true;
 blockMap[75+','+32] = true;
 blockMap[75+','+33] = true;
 blockMap[75+','+34] = true;
 blockMap[75+','+35] = true;
 blockMap[75+','+36] = true;
 blockMap[75+','+37] = true;
 blockMap[75+','+38] = true;
 blockMap[75+','+39] = true;
 blockMap[76+','+40] = true;
 blockMap[76+','+41] = true;
 blockMap[76+','+42] = true;
 blockMap[76+','+43] = true;
 blockMap[76+','+44] = true;
 blockMap[76+','+45] = true;
 blockMap[76+','+46] = true;
 blockMap[76+','+47] = true;
 blockMap[76+','+48] = true;
 blockMap[76+','+49] = true;
 blockMap[77+','+50] = true;
 blockMap[77+','+51] = true;
 blockMap[77+','+52] = true;
 blockMap[77+','+53] = true;
 blockMap[77+','+54] = true;
 blockMap[77+','+55] = true;
 blockMap[77+','+56] = true;
 blockMap[77+','+57] = true;
 blockMap[77+','+58] = true;
 blockMap[78+','+59] = true;
 blockMap[78+','+60] = true;
 blockMap[78+','+61] = true;
 blockMap[78+','+62] = true;
 blockMap[78+','+63] = true;
 blockMap[78+','+64] = true;
 blockMap[78+','+65] = true;
 blockMap[77+','+66] = true;
 blockMap[76+','+67] = true;
 blockMap[75+','+68] = true;
 blockMap[74+','+69] = true;
 blockMap[73+','+70] = true;
 blockMap[72+','+71] = true;
 blockMap[71+','+72] = true;
 blockMap[70+','+73] = true;
 blockMap[69+','+74] = true;
 blockMap[68+','+75] = true;
 blockMap[67+','+76] = true;
 blockMap[66+','+76] = true;
 blockMap[65+','+76] = true;
 blockMap[64+','+76] = true;
 blockMap[63+','+76] = true;
 blockMap[62+','+76] = true;
 blockMap[61+','+76] = true;
 blockMap[60+','+76] = true;
 blockMap[59+','+76] = true;
 blockMap[58+','+75] = true;
 blockMap[57+','+75] = true;
 blockMap[56+','+75] = true;
 blockMap[55+','+75] = true;
 blockMap[54+','+75] = true;
 blockMap[53+','+75] = true;
 blockMap[52+','+75] = true;
 blockMap[51+','+75] = true;
 blockMap[50+','+74] = true;
 blockMap[49+','+74] = true;
 blockMap[48+','+74] = true;
 blockMap[47+','+74] = true;
 blockMap[46+','+74] = true;
 blockMap[45+','+74] = true;
 blockMap[44+','+74] = true;
 blockMap[43+','+74] = true;
 blockMap[42+','+74] = true;
 blockMap[41+','+73] = true;
 blockMap[40+','+73] = true;
 blockMap[39+','+73] = true;
 blockMap[38+','+73] = true;
 blockMap[37+','+73] = true;
 blockMap[36+','+73] = true;
 blockMap[35+','+73] = true;
 blockMap[34+','+73] = true;
 blockMap[33+','+72] = true;
 blockMap[32+','+72] = true;
 blockMap[31+','+72] = true;
 blockMap[30+','+72] = true;
 blockMap[29+','+72] = true;
 blockMap[28+','+72] = true;
 blockMap[27+','+72] = true;
 blockMap[26+','+72] = true;
 blockMap[25+','+72] = true;
 blockMap[24+','+72] = true;
 blockMap[23+','+71] = true;
 blockMap[22+','+70] = true;
 blockMap[21+','+69] = true;
 blockMap[20+','+68] = true;
 blockMap[19+','+68] = true;
 blockMap[78+','+66] = true;
 blockMap[77+','+67] = true;
 blockMap[76+','+68] = true;
 blockMap[75+','+69] = true;
 blockMap[74+','+70] = true;
 blockMap[73+','+71] = true;
 blockMap[72+','+72] = true;
 blockMap[71+','+73] = true;
 blockMap[70+','+74] = true;
 blockMap[69+','+75] = true;
 blockMap[68+','+76] = true;
 blockMap[41+','+74] = true;
 blockMap[50+','+75] = true;
 blockMap[58+','+76] = true;
 blockMap[33+','+73] = true;
 blockMap[23+','+72] = true;
 blockMap[22+','+71] = true;
 blockMap[21+','+70] = true;
 blockMap[20+','+69] = true;
 blockMap[18+','+68] = true;
 blockMap[17+','+67] = true;
 blockMap[16+','+66] = true;
 blockMap[15+','+65] = true;
 blockMap[14+','+64] = true;
 blockMap[13+','+63] = true;
 blockMap[12+','+62] = true;
 blockMap[11+','+61] = true;
 blockMap[10+','+60] = true;
 blockMap[9+','+59] = true;
 blockMap[8+','+58] = true;
 blockMap[7+','+57] = true;
 blockMap[75+','+30] = true;
 blockMap[76+','+39] = true;
 blockMap[77+','+49] = true;
 blockMap[78+','+58] = true;
 heightMap[65+','+55] = 2;
 heightMap[66+','+56] = 2;
 heightMap[69+','+54] = 2;
 blockMap[74+','+26] = true;
 blockMap[73+','+25] = true;
 blockMap[72+','+24] = true;
 blockMap[71+','+23] = true;
 blockMap[70+','+22] = true;
 blockMap[69+','+21] = true;
 blockMap[68+','+20] = true;
 blockMap[67+','+19] = true;
 blockMap[66+','+18] = true;
 blockMap[65+','+17] = true;
 blockMap[64+','+16] = true;
 heightMap[62+','+65] = 2;
 heightMap[62+','+64] = 2;
 heightMap[63+','+64] = 2;
 heightMap[64+','+64] = 2;
 heightMap[45+','+69] = 2;
heightMap[51+','+70] = 2;
heightMap[52+','+70] = 2;
heightMap[53+','+70] = 2;
heightMap[54+','+70] = 2;
heightMap[55+','+70] = 2;
heightMap[56+','+70] = 2;
heightMap[57+','+70] = 2;
heightMap[59+','+71] = 2;
heightMap[60+','+71] = 2;
heightMap[59+','+70] = 2;
heightMap[60+','+70] = 2;
heightMap[61+','+71] = 2;
heightMap[62+','+71] = 2;
heightMap[63+','+71] = 2;
heightMap[64+','+71] = 2;
heightMap[65+','+71] = 2;
heightMap[65+','+69] = 2;
heightMap[59+','+65] = 2;
heightMap[55+','+50] = 2;
heightMap[56+','+50] = 2;
heightMap[57+','+50] = 2;
heightMap[72+','+45] = 2;
heightMap[72+','+46] = 2;
heightMap[72+','+47] = 2;
heightMap[72+','+48] = 2;
heightMap[72+','+49] = 2;
heightMap[72+','+50] = 2;
heightMap[72+','+51] = 2;
heightMap[71+','+36] = 2;
heightMap[71+','+37] = 2;
heightMap[71+','+38] = 2;
heightMap[71+','+39] = 2;
heightMap[71+','+40] = 2;
heightMap[71+','+41] = 2;
heightMap[71+','+42] = 2;
heightMap[70+','+24] = 2;
heightMap[70+','+25] = 2;
heightMap[70+','+26] = 2;
heightMap[70+','+27] = 2;
heightMap[70+','+28] = 2;
heightMap[70+','+29] = 2;
heightMap[70+','+30] = 2;
heightMap[70+','+31] = 2;
heightMap[19+','+35] = 2;
heightMap[20+','+35] = 2;
heightMap[21+','+35] = 2;
heightMap[18+','+38] = 2;
heightMap[18+','+37] = 2;
heightMap[18+','+36] = 2;
heightMap[18+','+35] = 2;
heightMap[7+','+55] = 2;
heightMap[73+','+60] = 2;
 heightMap[73+','+59] = 2;
 heightMap[73+','+58] = 2;
 heightMap[73+','+57] = 2;
 heightMap[73+','+56] = 2;
 heightMap[73+','+55] = 2;
 heightMap[73+','+54] = 2;
 heightMap[72+','+52] = 2;
 heightMap[72+','+53] = 2;
 heightMap[72+','+54] = 2;