function drawUtility(state, canvas, ctx, utilState)
{
    const height = canvas.height;
    const width = canvas.width;
    const util = state.marginal;

    const margin = 1/10;
    const xmin = width*margin;
    const ymin = height*margin;
    const xmax = width * (1-margin);
    const ymax = height * (1-margin);

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // hack gridlines
    ctx.font = "10px sans serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "black";
    const grd2 = ctx.createLinearGradient(xmax, 0, width, 0);
    grd2.addColorStop(0, "silver");
    grd2.addColorStop(1, "white");
    ctx.strokeStyle = grd2;
    let ypos2 = ymax;
    let hmov = 0.9*( (ymax - ymin)/15);
    for (let i = 1; i <= 15; i++){
        ypos2 -= hmov;
        ctx.beginPath();
        ctx.moveTo(xmin-4, ypos2);
        ctx.lineTo(width, ypos2);
        ctx.stroke();
        ctx.fillText(i, xmin-6, ypos2+4);
    }

    ctx.strokeStyle = "rgb(96,96,255)";
    ctx.fillStyle = "silver";
    ctx.lineWidth = 2;

    const w = (xmax - xmin)/util.length;
    const wadjust = 0.6;
    const hmax = (ymax-ymin) * 0.9;
    let xpos = xmin;
    for (let i = 0; i < util.length; i++)
    {
        const h = Math.max( util[i] * hmax, 1 );

        if (utilState.active === i || utilState.hover === i)
        {
            const grd = ctx.createLinearGradient(0, ymax-(hmax/2), 0, ymax+(hmax/2));
            if (utilState.active === i)
            {
                grd.addColorStop(0, "rgba(96,96,255,0)");
                grd.addColorStop(1, "rgba(96,96,255,1)");
            }
            else
            {
                grd.addColorStop(0, "rgba(192,192,192,0)");
                grd.addColorStop(1, "rgba(192,192,192,1)");
            }
    
            ctx.fillStyle = grd;
            ctx.fillRect(xpos, ymax-(hmax/2), w, hmax/2);
            ctx.fillStyle = "silver";
        }

        if (utilState.active === i) ctx.fillStyle = "white";
        if (utilState.hover === i) ctx.fillStyle = "grey";
        ctx.fillRect(xpos+(w*(1-wadjust)/2), ymax-h, w*wadjust, h);
        if (utilState.active === i) ctx.strokeRect(xpos+(w*(1-wadjust)/2), ymax-h, w*wadjust, h);
        ctx.fillStyle = "silver";

        //ctx.lineWidth = 2;
        //ctx.strokeRect(xpos+(w*(1-wadjust)/2), ymid, w*wadjust, h);

        xpos += w;
    }

    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    const normalizedMarginal = state.getmarginal().map(x => x/util.length);
    let ypos = 0;
    xpos = xmin;
    ctx.lineWidth = 2;
    for (let i = 0; i < normalizedMarginal.length + 1; i++)
    {
        const h = ypos * hmax;
        if (i != 0)
        {
            ctx.lineTo(xpos, ymax - h);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(xpos, ymax - h, 3, 0, 2 * Math.PI);
        ctx.fill();
        //if (i != normalizedMarginal.length)
        //{
        ctx.beginPath();
        ctx.moveTo(xpos, ymax - h);
        //}

        if (i >= normalizedMarginal.length) break;
        xpos += w;
        ypos += normalizedMarginal[i];
    }

    const grd = ctx.createLinearGradient(xpos, 0, width, 0);
    grd.addColorStop(0, "black");
    grd.addColorStop(1, "white");
    ctx.strokeStyle = grd;
    ctx.lineTo(width, ymax - (ypos*hmax));
    ctx.stroke();

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xmin, ymin);
    ctx.lineTo(xmin, ymax);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, ymax);
    ctx.lineTo(width, ymax);
    ctx.stroke();

    ctx.font = "10px sans serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    xpos = xmin;
    for (let i = 0; i <= normalizedMarginal.length; i++){
        ctx.beginPath();
        ctx.moveTo(xpos, ymax+4);
        ctx.lineTo(xpos, ymax);
        ctx.stroke();ctx.fillText(i, xpos, ymax+15);
        xpos += w;
    }
}

function adjustUtility(state, ypos, margin, i)
{
    startProcessing();
    const yadj = (1-margin-ypos)/(0.9 * (1-2*margin));
    state.marginal[i] = Math.min(Math.max(yadj, 0), 1);
    for (let j = 0; j < state.marginal.length; j++)
    {
        if (j < i) state.marginal[j] = Math.max(state.marginal[j], state.marginal[i]);
        if (j > i) state.marginal[j] = Math.min(state.marginal[j], state.marginal[i]);
    }
    forgetAllCandidateScores();
    forgetOverviews();
    endProcessing();
}

function initUtilityCanvas(state, canvas, ctx)
{
    const margin = 1/10;

    const utilityState = {
        active: -1,
        hover: -1,
        len: state.marginal.length
    };

    canvas.onmousemove = (e) => {
        if (processing || init) return;
        const coord = getCanvasCoord(e, canvas);
        if (utilityState.active === -1)
        {
            let xpos = margin;
            const w = (1-(2*margin)) / utilityState.len;
            utilityState.hover = -1;
            for (let i = 0; i < utilityState.len; i++)
            {
                if (coord[0] <= xpos+w && coord[0] >= xpos)
                {
                    utilityState.hover = i;
                    break;
                }
                xpos += w;
            }
        }
        else
        {
            adjustUtility(state, coord[1], margin, utilityState.active)
        }
        drawUtility(state, canvas, ctx, utilityState);
    }

    canvas.onmousedown = (e) => {
        if (processing || init) return;
        if (!(utilityState.hover === -1))
        {
            utilityState.active = utilityState.hover;
            utilityState.hover = -1;
        }
        canvas.onmousemove(e);
    };

    canvas.onmouseup = (e) => {
        if (processing || init) return;
        utilityState.active = -1;
        canvas.onmousemove(e);
    };

    canvas.onmouseleave = () => {
        if (processing || init) return;
        utilityState.active = -1;
        utilityState.hover = -1;
        drawUtility(state, canvas, ctx, utilityState);
    }


    drawUtility(state, canvas, ctx, utilityState);
}