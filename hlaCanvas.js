function drawHlaCanvas(state, canvas, ctx, zoom)
{
    const margin = 1/10;
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "white";
    ctx.fillRect(0,0,width,height);
    ctx.lineWidth = 1;
    
    const popw = zoom.getUtility();
    let ypos = 0;

    const grda = ctx.createLinearGradient(width*0.9, 0, width, 0);
    grda.addColorStop(0, "rgb(235,235,235)");
    grda.addColorStop(1, "white");
    const grdb = ctx.createLinearGradient(width*0.9, 0, width, 0);
    grdb.addColorStop(0, "rgb(245,245,245)");
    grdb.addColorStop(1, "white");

    let meanUtil = 0;
    for (let i = 0; i < state.population.length; i++)
    {
        const y = zoom.transformY(ypos);
        const h = zoom.transformY(ypos+state.population[i]) - y;
        const x = zoom.transformX(0);
        const w = (zoom.transformX(popw[i])*0.95) - x;
        meanUtil += popw[i] * state.population[i];
        if (((y + h) >= margin)  && (y < (1-margin)) )
        {
            const ydraw = Math.max(margin, y);
            const hdraw = Math.min(1-margin-ydraw, h - (ydraw-y));
            const y1b = Math.floor(ydraw * height);
            const y2b = Math.ceil((ydraw+hdraw) * height);
            const yreal = y1b;
            const hreal = Math.max(y2b - y1b, 1);

            if (i === zoom.hover)
            {
                const grd = ctx.createLinearGradient(0, 0, width, 0);
                grd.addColorStop(0, "rgb(224, 224, 255)");
                grd.addColorStop(1, "white");
                ctx.fillStyle = grd;
            }
            else
            {
                if (i%2 == 0) ctx.fillStyle = grda;
                else ctx.fillStyle = grdb;
            }
            ctx.fillRect(0,yreal,width,hreal);

            let drawW = w*width;
            ctx.fillStyle = "grey";
            if (i === zoom.hover) ctx.fillStyle = "rgb(192,192,255)";
            if (i === zoom.active)
            {
                ctx.fillStyle = "black";
                drawW = Math.max(1, drawW);
            }
            ctx.fillRect(x*width,yreal,drawW,hreal);
        }
        ypos += state.population[i];
    }

    ctx.fillStyle = "black";
    ctx.font = "14px sans serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.25)";

    const marginal = state.getmarginal();
    let maxutil = 0;
    for (let i = 0; i < marginal.length; i++) maxutil += marginal[i];
    let xpos = 1;
    while (xpos <= maxutil)
    {
        const drawx = 0.95*width*(xpos/maxutil);
        ctx.beginPath();
        ctx.moveTo(drawx, height*margin);
        ctx.lineTo(drawx, height*(1-margin) + 18);
        ctx.stroke();

        ctx.fillText(xpos, drawx, height*(1-margin) + 32);

        xpos += 1;
    }

    const meanx = 0.95*zoom.transformX(meanUtil)*width;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(meanx, height*margin - 18);
    ctx.lineTo(meanx, height*margin-9);
    ctx.stroke();
    ctx.textAlign = "start";
    ctx.fillText((meanUtil*maxutil).toFixed(2), meanx+1, height*margin - 22);
    scoreShowDesign.textContent = "Score: " + (meanUtil*maxutil).toFixed(5);
    ctx.beginPath();
    ctx.moveTo(0, height*margin-9);
    ctx.lineTo(width, height*margin-9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, height*(1-margin)+9);
    ctx.lineTo(width, height*(1-margin)+9);
    ctx.stroke();
    ctx.lineWidth = 1;

    if (zoom.y1 > 0)
    {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(0, height*margin);
        ctx.lineTo(width, height*margin);
        ctx.stroke();
    }
    if (zoom.y2 < 1)
    {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(0, height*(1-margin));
        ctx.lineTo(width, height*(1-margin));
        ctx.stroke();
    }
    let z = 1;
}

function checkHover(state, zoom, mousey)
{
    let ypos = 0;
    for (let i = 0; i < state.population.length; i++)
    {
        const ymin = zoom.transformY(ypos);
        const ymax = zoom.transformY(ypos+state.population[i]);
        if (ymin < mousey && ymax > mousey)
        {
            return i;
        }
        ypos += state.population[i];
    }
    return -1;
}


function initHLACanvas(state, canvas, ctx)
{
    const hlaZoom = {
        x1 : 0,
        x2 : 1,
        y1 : 0,
        y2 : 1,
        hover : -1,
        active : -1,
        cache : null,
        draw2 : () => {}
    }
    hlaZoom.getUtility = () => {
        if (hlaZoom.cache === null)
        {
            startProcessing();
            hlaZoom.cache = [];
            const marginal = state.getmarginal();
            let maxutil = 0;
            for (let i = 0; i < marginal.length; i++) maxutil += marginal[i];

            for (let i = 0; i < state.distributions.length; i++)
            {
                let util = 0;
                let cumu = 0;
                for (let j = 0; j < marginal.length; j++)
                {
                    util += cumu * state.distributions[i][j];
                    cumu += marginal[j];
                }
                util += state.distributions[i][marginal.length] * cumu;
                hlaZoom.cache.push(util/maxutil);
            }
            endProcessing();
        }
        return hlaZoom.cache;
    }

    hlaZoom.transformX = (x) => {
        return (x - hlaZoom.x1)/(hlaZoom.x2 - hlaZoom.x1);
    }
    const margin = 1/10;
    hlaZoom.transformY = (y) => {
        return ((1-(2*margin))*(y - hlaZoom.y1)/(hlaZoom.y2 - hlaZoom.y1)) + margin;
    }


    canvas.onwheel = (e) => {
        e.preventDefault();
        if (processing || init) return;

        let zoom = Math.exp(e.deltaY/1000);
        zoom = Math.max(0.8, Math.min(zoom, 1.2));

        const coord = getCanvasCoord(e, canvas);
        const normaly = (coord[1] - margin)/(1-(2*margin));
        const clipy = Math.max(0, Math.min(normaly, 1));
        const ymid = (hlaZoom.y1 * (1-clipy)) + (hlaZoom.y2 * clipy);
        hlaZoom.y1 = ((hlaZoom.y1 - ymid)*zoom) + ymid;
        hlaZoom.y2 = ((hlaZoom.y2 - ymid)*zoom) + ymid;
        if (hlaZoom.y2 - hlaZoom.y1 < 1e-6)
        {
            hlaZoom.y1 = ymid - (1e-6)*clipy;
            hlaZoom.y2 = ymid + (1e-6)*(1-clipy);
        }
        const ymin = -0.05
        const ymax = 1.05
        if (hlaZoom.y1 < ymin) hlaZoom.y1 = ymin;
        if (hlaZoom.y2 > ymax) hlaZoom.y2 = ymax;
        canvas.onmousemove(e);
    };

    canvas.onmousemove = (e) => {
        if (processing || init) return;
        const mousey = getCanvasCoord(e, canvas)[1];
        const i = checkHover(state, hlaZoom, mousey);
        hlaZoom.hover = i;
        drawHlaCanvas(state, canvas, ctx, hlaZoom);
    }

    canvas.onmouseleave = (e) => {
        if (processing || init) return;
        hlaZoom.hover = -1;
        drawHlaCanvas(state, canvas, ctx, hlaZoom);
    };

    canvas.onmousedown = (e) => {
        if (processing || init) return;
        if (hlaZoom.hover === hlaZoom.active) hlaZoom.active = -1;
        else hlaZoom.active = hlaZoom.hover;
        hlaZoom.draw2();
        canvas.onmousemove(e);
    };

    drawHlaCanvas(state, canvas, ctx, hlaZoom);
    return [() => {
        hlaZoom.cache = null;
        drawHlaCanvas(state, canvas, ctx, hlaZoom);
    }, hlaZoom];
}