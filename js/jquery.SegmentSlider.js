(function ($) {
    jQuery.fn.SegmentSlider = function (options) { //
        options = $.extend({
            segments: 8, // quantity of segments, default is 8  
            lineDur: 5000, //duration of line-time animation (ms), default is 5000
            segmentDur: 2000, //duration of toggle segment animation (ms), default is 2000
            segmentPhase: Math.floor(options.segmentDur/options.segments), // interval of time (ms) from start inimation of a segment before start animation of next segment 
            linePosition: 'bottom', // position of line-time: 'bottom' or 'top', default is 'bottom'
            lineHeight: '5px', // height of line-time (px, em, rem, %), default is '5px';
            lineColor: 'red', // color of line-time, default is 'red'
            lineOpacity: .5 // opacity of line-time, default is .5
        }, options);

        let make = function () {
            //реализация метода

            /////////////////////////////////////////
            //////////////// ПАРАМЕТРЫ //////////////
            /////////////////////////////////////////
            let N = options.segments; // количество разбиений канваса
            let slider = $(this);
            let imgs = slider.find('img');
            let iLast = imgs.length - 1; // индекс последнего слайда
            let iCurr = 0; // индекс текущего слайда
            let iNext; // индекс следующего
            let iPrev; // индекс предыдущего
            let sliderHover = false; //мышь над слайдером
            // нужен для проверки: запускать ли анимацию на Line
            let lineIsAnim = false; // на line есть анимация
            let slideIsAnim = false; // на slide есть анимация
            let iCanvas = 0; //счетчик номера набора текущих канвасов
            let iCanvasNext; //номера последующего набора текущих канвасов
            // iCanvas = 0 - текущие канвасы arrCanvas[0..N-1]
            // iCanvas = 0 - текущие контексты arrCtx[0..N-1]
            // iCanvas = 0 - текущее изображение arrImg[0]
            // iCanvas = 1 - текущие канвасы arrCanvas[N..2*N-1]
            // iCanvas = 1 - текущие контексты arrCtx[N..2*N-1]
            // iCanvas = 1 - текущее изображение arrImg[1]

            // общая формула:
            // arrCanvas[iCanvas * N .. (1 + iCanvas)*N-1]
            // arrCtx[iCanvas * N .. (1 + iCanvas)*N-1]
            // arrImg[iCanvas]
            // jqCanvas.eq(iCanvas * N .. (1 + iCanvas)*N-1)

            // определяем размер изображений
            // предпологается, что они одинаковы у всех изображений
            let imgW = imgs.first().width();
            let imgH = imgs.first().height();
            deltaW = imgW / N;

            // узнаем соотношение сторон в картинке
            let proportial = imgH / imgW; //соотн. сторон

            // костыль с padding-bottom для получения пропорционального слайдера
            slider.wrap("<div class='segment-slider-wrapper-middle'></div>");
            let wrapperMiddle = slider.parent();
            wrapperMiddle.wrap("<div class='segment-slider-wrapper-outer'></div>");
            let wrapperOuter = wrapperMiddle.parent();
            wrapperOuter.css('width', '100%');
            wrapperOuter.css('max-width', imgW);
            wrapperOuter.css('margin', '0 auto');
            wrapperMiddle.css('width', '100%');
            wrapperMiddle.css('padding-bottom', (proportial * 100) + '%');
            wrapperMiddle.css('position', 'relative');
            slider.css('width', '100%');
            slider.css('height', '100%');
            slider.css('overflow', 'hidden');
            slider.css('position', 'absolute');

            // скрывавем все содержимое слайдера 
            let divs = slider.find('div');
            divs.css('position', 'absolute');
            divs.css('display', 'none');

            //////////////////////////////////////////////
            ///////// СОЗДАНИЕ СТРЕЛОК ///////////////////
            //////////////////////////////////////////////
            slider.append('<div class="segment-slider-arrow segment-slider-arrow-down"><div class="segment-slider-arrow-inner"></div></div>');
            slider.append('<div class="segment-slider-arrow segment-slider-arrow-up"><div class="segment-slider-arrow-inner"></div></div>')
            let arrowUp = slider.children('.segment-slider-arrow-up');
            let arrowDown = slider.children('.segment-slider-arrow-down');

            ///////////////////////////////////////////
            /////////// СОЗДАНИЕ LINE /////////////////
            ///////////////////////////////////////////
            slider.append('<div class="segment-slider-line"><div class="segment-slider-innerline"></div></div>');
            let line = slider.children('.segment-slider-line');

            // стилизуем line, innerLine
            line.css(options.linePosition, '0');
            line.css('height', options.lineHeight);
            let innerLine = line.children('.segment-slider-innerline');
            innerLine.css('background-color', options.lineColor);
            innerLine.css('opacity', options.lineOpacity);

            // функции определения следующего и предыдущего индекса
            function nextI(i) {
                return (i < iLast) ? i + 1 : 0;
            }

            function prevI(i) {
                return (i > 0) ? i - 1 : iLast;
            }

            ////////////////////////////////////////
            ////// ПЕРВЫЙ ЗАПУСК АНИМАЦИИ ЛИНИИ ////
            ////////////////////////////////////////
            afterSlideAnimateDown();

            /////////////////////////////////////////////
            ////////// СОЗДАНИЕ CANVAS //////////////////
            /////////////////////////////////////////////
            // создаем n = 2*N canvas
            // для текущего и последующего или предыдущего
            for (let i = 0; i < 2 * N; i++) {
                slider.append(`<canvas id="canvas${i}"></canvas>`);
            }

            let arrCanvas = []; // n = 2 * N
            // arrCanvas[] нужен потому что у jqCanvas нет поддержки канвасов
            let arrCtx = []; // n = 2 * N
            let arrImg = []; // n = 2, для текущего и для последующего или предыдущего
            arrImg[0] = new Image();
            arrImg[1] = new Image();

            let jqCanvas = slider.children('canvas'); // jquery объект - набор всех канвасов

            // предварительная инициализация и стилизация (общее для всех) канвасов
            for (let i = 0; i < 2 * N; i++) {
                arrCanvas[i] = document.getElementById(`canvas${i}`);
                arrCtx[i] = arrCanvas[i].getContext('2d');
                arrCtx[i].imageSmoothingQuality = 'high';
                jqCanvas.eq(i).css('position', 'absolute');
                jqCanvas.eq(i).attr('width', deltaW);
                jqCanvas.eq(i).attr('height', imgH);
                jqCanvas.eq(i).css('width', 100 / N + '%');
                jqCanvas.eq(i).css('left', 100 * (i % N) / N + '%');
            }

            // [iCanvas * N .. (1 + iCanvas)*N-1]
            //стилизация канвасов
            // текущий набор перед анимацией bottom = 0, css-height = 100%
            for (let i = 0; i < N; i++) {
                jqCanvas.eq(i).css('bottom', '0');
                jqCanvas.eq(i).css('height', '100%');
            }

            // заполнение канвасов, соотв. текущему набору - вначале iCanvas = 0
            arrImg[0].onload = function () {
                for (let i = 0; i < N; i++) {
                    arrCtx[i].drawImage(arrImg[0], deltaW * i, 0, deltaW, imgH, 0, 0, deltaW, imgH);
                }

            };
            arrImg[0].src = imgs.eq(iCurr).attr('src');

            ////////////////////////////////
            ////// СТРЕЛКА ВНИЗ //////////
            ////////////////////////////////
            arrowDown.on('click', function () {
                if (!slideIsAnim) {
                    afterLineAnimateDown();
                }
            });

            ////////////////////////////////
            ////// СТРЕЛКА ВВЕРХ //////////
            ////////////////////////////////
            arrowUp.on('click', function () {
                if (!slideIsAnim) {
                    afterLineAnimateUp();
                }
            });

            //////////////////////////////////////////
            //// ПОСЛЕ АНИМАЦИИ ЛИНИИ (СЛАЙДЫ ВНИЗ) ///
            //////////////////////////////////////////
            function afterLineAnimateDown() {
                //console.log('анимация на сладах началась');

                arrowUp.addClass('disable');
                arrowDown.addClass('disable');

                // переключение параметра статуса анимации линии
                lineIsAnim = false;

                // положение Line обнуляется
                innerLine.css('width', '0');

                // известен iCurr
                // определение iNext
                iNext = nextI(iCurr);

                // переключение параметра статуса анимации
                slideIsAnim = true;

                // определение номера партии последующих канвасов
                iCanvasNext = (iCanvas == 0) ? 1 : 0;
                //console.log(`iCanvas = ${iCanvas}`);
                //console.log(`iCanvasNext = ${iCanvasNext}`);

                //стилизация канвасов
                // текущие канвасы перед анимацией имеют bottom = 0
                for (let i = iCanvas * N; i < (1 + iCanvas) * N; i++) {
                    jqCanvas.eq(i).css('bottom', '0');
                    jqCanvas.eq(i).css('top', 'auto');
                }

                // последующие канвасы перед анимацией имеют top = 0, css-height = 0
                for (let i = iCanvasNext * N; i < (1 + iCanvasNext) * N; i++) {
                    jqCanvas.eq(i).css('top', '0');
                    jqCanvas.eq(i).css('botom', 'auto');
                    jqCanvas.eq(i).css('height', '0%');
                }

                // заполнение канвасов
                arrImg[iCanvasNext].onload = function () {
                    for (let i = iCanvasNext * N; i < (1 + iCanvasNext) * N; i++) {
                        arrCtx[i].drawImage(arrImg[iCanvasNext], deltaW * (i % N), 0, deltaW, imgH, 0, 0, deltaW, imgH);
                    }

                    // функция анимации i-й пары сегментов
                    function animSegmentPair(i) {
                        //consoleconsole.log(`происходит анимация ${i}-й пары сегментов`);
                        jqCanvas.eq(iCanvas * N + i).animate({ // текущий сегмент сжимается вниз
                            'height': '0%'
                        }, options.segmentDur, function () {
                            if (i == N - 1) { // на последней анимации
                                //console.log('конец смены слайдов');

                                arrowUp.removeClass('disable');
                                arrowDown.removeClass('disable');

                                afterSlideAnimateDown(); // запустить анимацию линии

                                // определяется новый iCurr (индекс изображения)
                                iCurr = iNext;
                                                      
                                // определяется новый iCanvas
                                iCanvas = iCanvasNext;
                               
                            }

                        });

                        jqCanvas.eq(iCanvasNext * N + i).animate({ // сдедующий сегмент расширяется вниз
                            'height': '100%'
                        }, options.segmentDur);
                    }

                    for (let i = 0; i < N; i++) {
                        setTimeout(animSegmentPair, options.segmentPhase * i, i);
                    }

                };
                arrImg[iCanvasNext].src = imgs.eq(iNext).attr('src');
            }

            ////////////////////////////////////////////
            //// ПОСЛЕ АНИМАЦИИ ЛИНИИ (СЛАЙДЫ ВВЕРХ) ///
            ////////////////////////////////////////////
            function afterLineAnimateUp() {
                //console.log('анимация на сладах началась')

                arrowUp.addClass('disable');
                arrowDown.addClass('disable');

                // переключение параметра статуса анимации линии
                lineIsAnim = false;

                // положение Line обнуляется
                innerLine.css('width', '0');

                // известен iCurr
                // определение iPrev
                iPrev = prevI(iCurr);

                // переключение параметра статуса анимации
                slideIsAnim = true;

                // определение номера партии предыдущих канвасов
                iCanvasNext = (iCanvas == 0) ? 1 : 0;
                //console.log(`iCanvas = ${iCanvas}`);
                //console.log(`iCanvasNext = ${iCanvasNext}`);

                //стилизация канвасов
                // текущие канвасы перед анимацией имеют top = 0
                for (let i = iCanvas * N; i < (1 + iCanvas) * N; i++) {
                    jqCanvas.eq(i).css('top', '0');
                    jqCanvas.eq(i).css('bottom', 'auto');
                }

                // предыдущие канвасы перед анимацией имеют bottom = 0, css-height = 0
                for (let i = iCanvasNext * N; i < (1 + iCanvasNext) * N; i++) {
                    jqCanvas.eq(i).css('bottom', '0');
                    jqCanvas.eq(i).css('top', 'auto');
                    jqCanvas.eq(i).css('height', '0%');
                }

                // заполнение канвасов
                arrImg[iCanvasNext].onload = function () {
                    for (let i = iCanvasNext * N; i < (1 + iCanvasNext) * N; i++) {
                        arrCtx[i].drawImage(arrImg[iCanvasNext], deltaW * (i % N), 0, deltaW, imgH, 0, 0, deltaW, imgH);
                    }

                    // функция анимации i-й пары сегментов
                    function animSegmentPair(i) {
                        //console.log(`происходит анимация ${i}-й пары сегментов`);
                        jqCanvas.eq(iCanvas * N + i).animate({ // текущий сегмент сжимается вверх
                            'height': '0%'
                        }, options.segmentDur, function () {
                            if (i == N - 1) { // на последней анимации
                                //console.log('конец смены слайдов');
                                
                                arrowUp.removeClass('disable');
                                arrowDown.removeClass('disable');

                                afterSlideAnimateDown(); // запустить анимацию линии

                                // определяется новый iCurr (индекс изображения)
                                iCurr = iPrev;

                                // определяется новый iCanvas
                                iCanvas = iCanvasNext;
                                
                            }

                        });

                        jqCanvas.eq(iCanvasNext * N + i).animate({ // сдедующий сегмент расширяется вверх
                            'height': '100%'
                        }, options.segmentDur);
                    }

                    for (let i = 0; i < N; i++) {
                        setTimeout(animSegmentPair, options.segmentPhase * i, i);
                    }

                };
                arrImg[iCanvasNext].src = imgs.eq(iPrev).attr('src');

            }

            ////////////////////////////////////////////
            //// ПОСЛЕ АНИМАЦИИ СЛАЙДОВ (ВНИЗ) /////////
            ////////////////////////////////////////////
            function afterSlideAnimateDown() {
                // переключение параметра статуса анимации
                slideIsAnim = false;
                //console.log(`slideIsAnim = ${slideIsAnim}`);

                //запускается анимация на Line
                // переключение параметра статуса анимации
                lineIsAnim = true;
                //console.log(`lineIsAnim = ${lineIsAnim}`);
                if (!sliderHover) {
                    innerLine.animate({
                        'width': '100%'
                    }, options.lineDur, afterLineAnimateDown);
                }
            }

            /////////////////////////////////////////
            //////// МЫШКА ВХОДИТ НА SLIDE/////////
            /////////////////////////////////////////
            $(this).on('mouseenter', function () {
                sliderHover = true;

                if (lineIsAnim) { // если линия анимирована
                    // удалить анимацию на линии
                    innerLine.stop();
                    innerLine.css('width', '0%');
                    lineIsAnim = false;
                }
            });

            /////////////////////////////////////////
            //////// МЫШКА УХОДИТ ИЗ SLIDE //////////
            /////////////////////////////////////////
            $(this).on('mouseleave', function () {
                sliderHover = false;
                // если вывели мышку после того как ввели ее во время анимации линии
                // или после того как ввели ее во время анимации слайда и она закончилась
                // в этих двух случаях нет анимации слайда

                if (!slideIsAnim) {
                    // тоже что и первый запуск анимации линии
                    //console.log('запускаем заново')
                    lineIsAnim = true;
                    //console.log(`lineIsAnim = ${lineIsAnim}`);
                    if (!sliderHover) {
                        innerLine.animate({
                            'width': '100%'
                        }, options.lineDur, afterLineAnimateDown);
                    }
                }
            });
        }; ////////////////////////////// END ////////////////////////////////////////////////////////
        return this.each(make);

    };
})(jQuery);