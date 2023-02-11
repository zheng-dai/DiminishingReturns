var global_mhcModels = [null, null];

function readmhcmodel1(data)
{
    let ptr = 0;
    const models = [];
    for (let i = 0; i < 294; i++)
    {
        const allele = [];
        for (let j = 0; j < 9; j++)
        {
            const position = [];
            for (let k = 0; k < 20; k++)
            {
                const v = ( ( ( data[ptr] + (data[ptr+1] * 256) + (data[ptr+2] * 65536) )/16777215 ) * 2) - 1;
                position.push(v* 6.4263616);
                ptr += 4;
            }
            allele.push(position);
        }
        models.push(allele);
    }
    return models;
}

function readmhcmodel2(data)
{
    let ptr = 0;
    const models = [];
    for (let i = 0; i < 280; i++)
    {
        const allele = [];
        for (let ii = 0; ii < 7; ii++)
        {
            const register = [];
            for (let j = 0; j < 15; j++)
            {
                const position = [];
                for (let k = 0; k < 20; k++)
                {
                    const v = ( ( ( data[ptr] + (data[ptr+1] * 256) + (data[ptr+2] * 65536) )/16777215 ) * 2) - 1;
                    position.push(v* 5.7642064);
                    ptr += 4;
                }
                register.push(position);
            }
            allele.push(register);
        }
        models.push(allele);
    }
    return models;
}

function getImageData(img, mhcidx, cb) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    if (mhcidx == 1)
    {
        global_mhcModels[0] = readmhcmodel1(data);
    }
    if (mhcidx == 2)
    {
        global_mhcModels[1] = readmhcmodel2(data);
    }
    cb();
}

function startLoadMhc(filesrc, mhcidx, cb) {
    if (global_mhcModels[mhcidx-1] === null)
    {
        const imageObj = new Image();
        imageObj.onload = function() {
            getImageData(imageObj, mhcidx, cb);
        };
        imageObj.src = filesrc;
    }
    else
    {
        cb();
        return;
    }
}