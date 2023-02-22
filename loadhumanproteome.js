var humanProteome = null;

/*
function codeCharX(c){
    switch(c) {
        case "A": return 0;
        case "C": return 1;
        case "D": return 2;
        case "E": return 3;
        case "F": return 4;
        case "G": return 5;
        case "H": return 6;
        case "I": return 7;
        case "K": return 8;
        case "L": return 9;
        case "M": return 10;
        case "N": return 11;
        case "P": return 12;
        case "Q": return 13;
        case "R": return 14;
        case "S": return 15;
        case "T": return 16;
        case "V": return 17;
        case "W": return 18;
        case "Y": return 19;
        case "X": return 20;
        default: return -1;
    }
}

function getAllkmer(i)
{
    if (i <= 0) return [""];
    else {
        const letters = "ACDEFGHIKLMNPQRSTVWYXU,";
        const kmers = getAllkmer(i-1);
        const ret = [];
        for (let i = 0; i < kmers.length; i++)
        {
            for (let j = 0; j < 23; j++)
            {
                ret.push(kmers[i] + letters[j]);
            }
        }
        return ret;
    }
}
*/

function find6mer(kmer, initindex)
{
    let x = 0;
    for (let i = 0; i < 6; i++)
    {
        x = (x * 20) + codeChar(kmer[initindex + i]);
    }
    return humanProteome[x];
}

function scanForHuman(kmer)
{
    for (let i = 0; i < kmer.length - 5; i++)
    {
        if (! find6mer(kmer, i)) return false;
    }
    return true;
}

function loadProteome(data)
{
    let s = [];
    for (let i = 0; i < 2666680; i++)
    {
        for (let j = 0; j < 3; j++)
        {
            let x = data[j+i*4];
            for (let k = 0; k < 8; k++)
            {
                s.push(x >= 128);
                x = (x%128)*2;
            }
        }
        if (i%10000 == 0) updateLoading(i/26666.8);
    }
    humanProteome = s;
    updateLoading(100);
}

function loadHumanProteome(cb) {
    if (humanProteome === null)
    {
        const imageObj = new Image();
        imageObj.onload = function() {
            const canvas = document.createElement("canvas");
            canvas.width = imageObj.width;
            canvas.height = imageObj.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(imageObj, 0, 0);
            const data = ctx.getImageData(0, 0, imageObj.width, imageObj.height).data;
            loadProteome(data);
            cb();
        };
        imageObj.src = "humanProteome_6mer.png";
    }
    else
    {
        cb();
        return;
    }
}