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
    let finalY = 0;
    let activeDraw = 0;
    for (let ii = 0; ii < state.population.length; ii++)
    {
        const i = zoom.permutation[ii];
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
            const diff = Math.max(activeDraw, y1b) - y1b;
            const yreal = y1b + diff;
            const hreal = Math.max(y2b - yreal, 1) + diff;
            if (yreal + hreal > finalY || i === zoom.hover || i === zoom.active)
            {
                finalY = yreal+hreal;
                if (i === zoom.hover || i === zoom.active) activeDraw = finalY;

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
    if (zoom.drag > 1)
    {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        const m1 = [zoom.mouseCoord[0]*width, zoom.mouseCoord[1]*height];
        const m2 = [zoom.dragCoord[0]*width, zoom.dragCoord[1]*height];
        ctx.strokeRect(Math.min(m1[0],m2[0]), Math.min(m1[1],m2[1]),
            Math.abs(m1[0]-m2[0]), Math.abs(m1[1]-m2[1]));
    }
}

function checkHover(state, zoom, mousey)
{
    let ypos = 0;
    for (let ii = 0; ii < state.population.length; ii++)
    {
        const i = zoom.permutation[ii];
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

function yinv(x, y1, y2, margin)
{
    const x1 = (x - margin)/(1-(2*margin));
    return (x1 * (y2-y1)) + y1;
}

function zoomToTarget(state, canvas, ctx, zoom, y1,y2,t1,t2,t,donecb)
{
    const tfinal = 15;
    const tfrac = t/tfinal;

    if (t < tfinal)
    {
        w = Math.pow(tfrac, 0.25);
        zoom.y1 = (t1*w)+(y1*(1-w));
        zoom.y2 = (t2*w)+(y2*(1-w));

        drawHlaCanvas(state, canvas, ctx, zoom);
        ctx.globalAlpha = 1-w;
        const margin = 1/10;
        const width = canvas.width;
        const height = canvas.height;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        const yinv1 = yinv( zoom.mouseCoord[1], y1, y2, margin );
        const yinv2 = yinv( zoom.dragCoord[1], y1, y2, margin );
        const m1 = [zoom.mouseCoord[0]*width, zoom.transformY(yinv1)*height];
        const m2 = [zoom.dragCoord[0]*width, zoom.transformY(yinv2)*height];
        ctx.strokeRect(Math.min(m1[0],m2[0]), Math.min(m1[1],m2[1]),
            Math.abs(m1[0]-m2[0]), Math.abs(m1[1]-m2[1]));
        //const hgt = (Math.abs(m1[1]-m2[1]) * (1-w)) + ((1-(2*margin)) * height * w);
        //const yupper = (Math.min(m1[1],m2[1]) * (1-w)) + (margin * height * w);
        //ctx.strokeRect(Math.min(m1[0],m2[0]), yupper,
        //    Math.abs(m1[0]-m2[0]), hgt);
        ctx.globalAlpha = 1;

        window.setTimeout(
            () => {window.requestAnimationFrame(() => zoomToTarget(state, canvas, ctx, zoom, y1,y2,t1,t2,t+1,donecb));}, 1000 / 60);
    }
    else
    {
        zoom.y1 = t1;
        zoom.y2 = t2;
        donecb();
    }
}

function l2distsq(a, b){
    return Math.pow(a[0]-b[0],2) + Math.pow(a[1]-b[1],2);
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
        draw2 : () => {},
        drag : 0, //0 for neutral, 1 for drag, 2 for dragging
        dragCoord : [0,0],
        mouseCoord : [0,0],
        permutation : []
    }
    for (let i = 0; i < state.population.length; i++)
    {
        hlaZoom.permutation.push(i);
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
    
    const margin = 1/10;
    const ymin = -0.05
    const ymax = 1.05

    // x and y between 0 and 1
    hlaZoom.transformX = (x) => {
        return (x - hlaZoom.x1)/(hlaZoom.x2 - hlaZoom.x1);
    }
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
        if (hlaZoom.y1 < ymin) {
            hlaZoom.y1 = ymin;
            if (hlaZoom.y2 - hlaZoom.y1 < 1e-6) hlaZoom.y2 = ymin + 1e-6;
        }
        if (hlaZoom.y2 > ymax)
        {
            hlaZoom.y2 = ymax;
            if (hlaZoom.y2 - hlaZoom.y1 < 1e-6) hlaZoom.y1 = ymax - 1e-6;
        }
        canvas.onmousemove(e);
    };

    canvas.onmousemove = (e) => {
        if (processing || init) return;
        const mouseCoord =  getCanvasCoord(e, canvas);
        if ((hlaZoom.drag > 1) || ((hlaZoom.drag === 1) && (l2distsq(mouseCoord, hlaZoom.dragCoord)>0.001)))
        {
            //console.log("A")
            hlaZoom.hover = -1;
            hlaZoom.drag = 2;
            hlaZoom.mouseCoord = [mouseCoord[0], mouseCoord[1]];
            if (hlaZoom.mouseCoord[1] < margin) hlaZoom.mouseCoord[1] = margin;
            if (hlaZoom.mouseCoord[1] > 1-margin) hlaZoom.mouseCoord[1] = 1-margin;
            //const deltaY = mouseCoord[1] - hlaZoom.dragCoord[1];
        }
        else
        {
            //console.log("B")
            const i = checkHover(state, hlaZoom, mouseCoord[1]);
            hlaZoom.hover = i;
        }
        drawHlaCanvas(state, canvas, ctx, hlaZoom);
    }

    canvas.onmouseleave = (e) => {
        if (processing || init) return;
        hlaZoom.drag = 0;
        hlaZoom.hover = -1;
        drawHlaCanvas(state, canvas, ctx, hlaZoom);
    };

    canvas.onmouseup = (e) => {
        if (processing || init) return;
        if (hlaZoom.drag > 1)
        {
            const ym1 = (Math.min(hlaZoom.dragCoord[1], hlaZoom.mouseCoord[1])-margin)/(1-(2*margin));
            const ym2 = (Math.max(hlaZoom.dragCoord[1], hlaZoom.mouseCoord[1])-margin)/(1-(2*margin));
            let ytarget1 = hlaZoom.y1 + (ym1*(hlaZoom.y2-hlaZoom.y1));
            let ytarget2 = hlaZoom.y1 + (ym2*(hlaZoom.y2-hlaZoom.y1));
            if (ytarget2 - ytarget1 < 1e-6)
            {
                const ymid = (ytarget1+ytarget2)/2;
                ytarget1 = ymid - (1e-6/2);
                ytarget2 = ymid + (1e-6/2);
            }
            if (ytarget1 < ymin) {
                ytarget1 = ymin;
                if (ytarget2 - ytarget1 < 1e-6) ytarget2 = ymin + 1e-6;
            }
            if (ytarget2 > ymax)
            {
                ytarget2 = ymax;
                if (ytarget2 - ytarget1 < 1e-6) ytarget1 = ymax - 1e-6;
            }
            hlaZoom.drag = 0;
            startProcessing();
            window.requestAnimationFrame(() => zoomToTarget(state, canvas, ctx, hlaZoom, hlaZoom.y1, hlaZoom.y2, ytarget1, ytarget2, 0, () => {
                endProcessing();
                canvas.onmousemove(e);
            }));
        }
        else
        {
            if (hlaZoom.hover === hlaZoom.active) hlaZoom.active = -1;
            else hlaZoom.active = hlaZoom.hover;
            hlaZoom.draw2();

            hlaZoom.drag = 0;
            canvas.onmousemove(e);
        }
    };

    canvas.onmousedown = (e) => {
        if (processing || init) return;
        hlaZoom.drag = 1;
        hlaZoom.dragCoord = getCanvasCoord(e, canvas);
        hlaZoom.mouseCoord = hlaZoom.dragCoord;
        if (hlaZoom.dragCoord[1] < margin) hlaZoom.dragCoord[1] = margin;
        if (hlaZoom.dragCoord[1] > 1-margin) hlaZoom.dragCoord[1] = margin;
    };

    hlaZoom.zoomIn = () => {
        if (processing || init) return;
        hlaZoom.dragCoord = [0, (0.25 * (1-(2*margin))) + margin];
        hlaZoom.mouseCoord = [1, (0.75 * (1-(2*margin))) + margin];
        const ym1 = (Math.min(hlaZoom.dragCoord[1], hlaZoom.mouseCoord[1])-margin)/(1-(2*margin));
        const ym2 = (Math.max(hlaZoom.dragCoord[1], hlaZoom.mouseCoord[1])-margin)/(1-(2*margin));
        let ytarget1 = hlaZoom.y1 + (ym1*(hlaZoom.y2-hlaZoom.y1));
        let ytarget2 = hlaZoom.y1 + (ym2*(hlaZoom.y2-hlaZoom.y1));
        if (ytarget2 - ytarget1 < 1e-6)
        {
            const ymid = (ytarget1+ytarget2)/2;
            ytarget1 = ymid - (1e-6/2);
            ytarget2 = ymid + (1e-6/2);
        }
        if (ytarget1 < ymin) {
            ytarget1 = ymin;
            if (ytarget2 - ytarget1 < 1e-6) ytarget2 = ymin + 1e-6;
        }
        if (ytarget2 > ymax)
        {
            ytarget2 = ymax;
            if (ytarget2 - ytarget1 < 1e-6) ytarget1 = ymax - 1e-6;
        }
        hlaZoom.drag = 0;
        startProcessing();
        window.requestAnimationFrame(() => zoomToTarget(state, canvas, ctx, hlaZoom, hlaZoom.y1, hlaZoom.y2, ytarget1, ytarget2, 0, () => {
            endProcessing();
            drawHlaCanvas(state, canvas, ctx, hlaZoom);
        }));
    }

    hlaZoom.zoomOut = () => {
        if (processing || init) return;
        hlaZoom.dragCoord = [0, (0 * (1-(2*margin))) + margin];
        hlaZoom.mouseCoord = [1, (1 * (1-(2*margin))) + margin];
        const ym1 = -0.5;
        const ym2 = 1.5;
        let ytarget1 = hlaZoom.y1 + (ym1*(hlaZoom.y2-hlaZoom.y1));
        let ytarget2 = hlaZoom.y1 + (ym2*(hlaZoom.y2-hlaZoom.y1));
        if (ytarget1 < ymin) {
            ytarget1 = ymin;
        }
        if (ytarget2 > ymax)
        {
            ytarget2 = ymax;
        }
        hlaZoom.drag = 0;
        startProcessing();
        window.requestAnimationFrame(() => zoomToTarget(state, canvas, ctx, hlaZoom, hlaZoom.y1, hlaZoom.y2, ytarget1, ytarget2, 0, () => {
            endProcessing();
            drawHlaCanvas(state, canvas, ctx, hlaZoom);
        }));
    }

    drawHlaCanvas(state, canvas, ctx, hlaZoom);
    return [() => {
        hlaZoom.cache = null;
        drawHlaCanvas(state, canvas, ctx, hlaZoom);
    }, hlaZoom];
}