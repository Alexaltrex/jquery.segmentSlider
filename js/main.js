$(function () {
    $('.your-slider').SegmentSlider({
        segments: 8, // quantity of segments, default is 8  
        lineDur: 2000, //duration of line-time animation (ms), default is 5000
        segmentDur: 1400, //duration of toggle segment animation (ms), default is 2000
        //segmentPhase: 125, // interval of time (ms) from start inimation of a segment before start animation of next segment 
        linePosition: 'bottom', // position of line-time: 'bottom' or 'top', default is 'bottom'
        lineHeight: '10px', // height of line-time (px, em, rem, %), default is '5px';
        lineColor: 'white', // color of line-time, default is 'red'
        lineOpacity: .5 // opacity of line-time, default is .5
    });
})