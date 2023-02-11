var hlanameplate = document.getElementById("hlanameplate");

function drawInitDistrCanvas(state, hlastate, candidateState, canvas, ctx){
    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,width,height);
    
    const margin = 1/10;
    const xmin = width*margin;
    const ymin = height*margin;
    const xmax = width * (1-margin);
    const ymax = height * (1-margin);

    const dlen = state.distributions[0].length;
    const w = (xmax-xmin)/dlen;

    ctx.lineWidth = 1;
    const grd = ctx.createLinearGradient(0, ymax, 0, ymin);
    grd.addColorStop(0, "silver");
    grd.addColorStop(1, "white");
    ctx.strokeStyle = grd;
    ctx.fillStyle = "black";
    ctx.font = "10px sans serif";
    ctx.textAlign = "center";
    let xpos = xmin + w/2;
    for (let i = 0; i < dlen; i++)
    {
        ctx.beginPath();
        ctx.moveTo(xpos, ymax+4);
        ctx.lineTo(xpos, ymin);
        ctx.stroke();
        if (i == dlen-1) ctx.fillText(i + "+", xpos+3, ymax+12);
        else ctx.fillText(i, xpos, ymax+12);
        xpos += w;
    }

    if (! (hlastate.active === -1) )
    {
        const name = state.populationNames[hlastate.active];
        hlanameplate.innerHTML = name;
        const distr = state.distributions[hlastate.active];

        let p = 0;
        if (!(candidateState.selected === null)) p = candidateState.selected.pvec[hlastate.active];
        let distr2 = [distr[0]*(1-p)];
        for (let i = 1; i < distr.length-1; i++)
        {
            distr2.push( (distr[i]*(1-p)) + (distr[i-1]*p) );
        }
        distr2.push( distr[distr.length-1] + (distr[distr.length-1]*p) )


        xpos = xmin;
        for (let i = 0; i < distr.length; i++){
            if (!(candidateState.selected === null))
            {
                const h2 = distr2[i] * (ymax - ymin)
                ctx.fillStyle = "silver";
                ctx.fillRect(xpos+(w*0.3), ymax-h2 , w*0.6, h2);
            }

            const h1 = distr[i] * (ymax - ymin)
            ctx.fillStyle = "black";
            ctx.fillRect(xpos+(w*0.1), ymax-h1 , w*0.6, h1);

            xpos += w;
        }
    }
    else
    {
        hlanameplate.innerHTML = "<br\><br\><br\><br\>";
    }

    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(0, ymax);
    ctx.lineTo(width, ymax);
    ctx.stroke();
}

function initDistrCanvas(state, hlastate, candidateState, canvas, ctx){
    hlastate.draw2 = () => drawInitDistrCanvas(state, hlastate, candidateState, canvas, ctx);
    candidateState.draw2 = () => drawInitDistrCanvas(state, hlastate, candidateState, canvas, ctx);
    drawInitDistrCanvas(state, hlastate, candidateState, canvas, ctx);
}