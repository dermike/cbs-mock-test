(function wrap() {
  const questions = window.cbsquestions;

  let alerts = document.getElementById('alerts'),
    qdiv = document.getElementById('questions'),

    quiz = {
      'userScore': 0,
      'totalQuestions': questions.length,
      'init': () => {
        let querystring = window.location.href.split('?').slice(1).join('?');
        if (querystring === 'embedded=true') {
          document.body.classList.add('embedded');
        }
        questions.forEach((value, index) => {
          let q = document.createElement('article'),
            template;
          q.classList.add('question');
          q.setAttribute('aria-hidden', 'true');
          q.classList.add('hide');

          template = `<section>
                        <h2>${value.header}</h2>
                        <p>${value.body}</p>
                        <form data-question="${index}">
                          <ul role="list">`;

          value.answers.forEach(alt => {
            template += `<li class="checkbox" role="listitem">
                           <label><input type="checkbox" name="0"> <span>${alt.answer}</span></label>
                         </li>`;
          });

          template += `</ul>
                     </form>
                     <div class="buttons" role="navigation">
                       <button class="btn btn-primary answer" role="button">Answer</button>
                       <button class="btn btn-primary next" role="button" aria-disabled="true" disabled>Next</button>
                     </div>
                   </section>`;

          q.innerHTML = template;
          qdiv.appendChild(q);
        });

        return quiz;
      },

      'start': () => {
        let next = document.getElementsByClassName('next'),
          prev = document.getElementsByClassName('answer'),

          nextQuestion = e => {
            let nextel = e.target.parentNode.parentNode.parentNode.nextElementSibling,
              current = e.target.parentNode.parentNode.parentNode,
              ending,
              stars;

            const getStars = s => {
              let templatefull = '<i class="star"></i>',
                templatehalf = '<i class="star-border"></i>',
                markup = '';
              markup += `<div role="img" aria-label="${s} stars">`;
              for (let i = 0; i < s; i += 1) {
                markup += templatefull;
              }
              for (let i = 0; i < 5 - s; i += 1) {
                markup += templatehalf;
              }
              markup += '</div>';
              return markup;
            };

            quiz.hideFeedback();
            current.classList.add('answered');
            current.classList.remove('current');
            current.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
              current.classList.add('hide');
            }, 500);
            if (nextel) {
              nextel.classList.remove('hide');
              setTimeout(() => {
                nextel.classList.add('current');
                nextel.setAttribute('aria-hidden', 'false');
              }, 100);
            } else {
              // set stars depending on result
              if (quiz.userScore === quiz.totalQuestions) {
                stars = getStars(5);
              } else {
                stars = getStars(Math.round(Math.floor(quiz.userScore / quiz.totalQuestions * 100) / 10 / 2));
              }

              ending = `<article class="question show" id="ending">
                          <section>
                            <h2>Finished!</h2>
                            ${stars}
                            <p>You got ${quiz.userScore} out of ${quiz.totalQuestions} points.</p>
                            <p><a href="javascript:document.location.reload();" class="btn btn-primary" role="button">Want to try again?</a></p>
                          </section>
                        </article>`;
              setTimeout(() => {
                qdiv.innerHTML = ending;
              }, 200);
              if (window.ga && ga.create) {
                ga('send', 'event', 'Quiz', 'Completed', 'oer-eng');
              }
            }
          },

          answerQuestion = e => {
            let childNodes = e.target.parentNode.parentNode.childNodes,
              current = e.target.parentNode.parentNode,
              answerCorrect,
              answerAlmost,
              correct,
              selected,
              checkboxes,
              feedback = '',
              type,
              eachCheckbox = (value, index) => {
                if (value.checked) {
                  selected += index.toString();
                }
                value.disabled = true;
                value.setAttribute('aria-disabled', 'true');
                if (correct.indexOf(index) > -1) {
                  value.nextElementSibling.classList.add('correct');
                }
              };

            if (current.querySelector('form') && !current.querySelectorAll('input:checked').length) {
              quiz.feedback('You need to choose an alternative before answering.');
              return false;
            }

            for (let i = 0; i < childNodes.length; i += 1) {
              if (childNodes[i].nodeName === 'FORM') {
                current = childNodes[i].getAttribute('data-question');
                correct = questions[current].correctAnswer;
                selected = '';
                checkboxes = childNodes[i].querySelectorAll('input');
                Array.prototype.forEach.call(checkboxes, eachCheckbox);
                if (selected === correct) {
                  answerCorrect = true;
                  quiz.userScore += 1;
                } else {
                  for (let c = 0; c < selected.length; c += 1) {
                    if (correct.indexOf(selected.charAt(c)) > -1) {
                      answerAlmost = true;
                    }
                  }
                  answerCorrect = false;
                }
              }

              if (childNodes[i].classList && childNodes[i].classList.contains('buttons')) {
                let nb = childNodes[i].querySelectorAll('.next')[0];
                nb.disabled = false;
                nb.setAttribute('aria-disabled', 'false');
              }
            }
            // animate next button from left to right
            setTimeout(() => {
              let section = document.querySelector('.current section'),
                swidth = section.offsetWidth,
                nb = section.querySelector('.next'),
                bwidth = nb.offsetWidth,
                transform = swidth - bwidth;
              nb.style.webkitTransform = `translateX(${transform}px)`;
              nb.style.transform = `translateX(${transform}px)`;
              setTimeout(() => {
                nb.classList.add('right');
                nb.style.webkitTransform = '';
                nb.style.transform = '';
              }, 550);
            }, 10);
            e.target.disabled = true;
            e.target.setAttribute('aria-disabled', 'true');

            if (answerCorrect) {
              type = 'alert-correct';
              feedback += `<h3>${questions[current].feedbackCorrect}</h3>`;
            } else if (answerAlmost && questions[current].feedbackAlmost) {
              type = 'alert-almost';
              feedback += `<h3>${questions[current].feedbackAlmost}</h3>`;
            } else {
              type = 'alert-error';
              feedback += `<h3>${questions[current].feedbackWrong}</h3>`;
            }

            quiz.feedback(feedback, type);
          };

        for (let i = 0; i < next.length; i += 1) {
          next[i].addEventListener('click', nextQuestion, false);
        }

        for (let i = 0; i < prev.length; i += 1) {
          prev[i].addEventListener('click', answerQuestion, false);
        }

        alerts.addEventListener('click', e => {
          if (e.target.tagName === 'SPAN' || e.target.tagName === 'BUTTON') {
            quiz.hideFeedback();
          }
        });

        // disable selecting more than the intended available answers
        document.addEventListener('click', e => {
          if (e.target.type === 'checkbox') {
            let current = e.target.parentNode.parentNode.parentNode.parentNode.getAttribute('data-question'),
              checkboxes = e.target.parentNode.parentNode.parentNode.querySelectorAll('input:checked'),
              answers = questions[current].correctAnswer.length;
            if (answers === 1 && answers < checkboxes.length) {
              Array.prototype.forEach.call(checkboxes, value => {
                if (value !== e.target) {
                  value.checked = false;
                }
              });
            }
          }
        });

        document.addEventListener('keydown', e => {
          if (e.keyCode === 27 && alerts.childNodes.length) {
            document.querySelector('.close').click();
          }
        });
        return quiz;
      },
      'hideFeedback': () => {
        if (alerts.firstElementChild) {
          let alertsHeight = alerts.offsetHeight;
          alerts.style.webkitTransform = `translateY(-${alertsHeight}px)`;
          alerts.style.transform = `translateY(-${alertsHeight}px)`;
          setTimeout(() => {
            alerts.style.webkitTransform = '';
            alerts.style.transform = '';
            alerts.removeChild(alerts.firstElementChild);
          }, 310);
        }
      },
      'feedback': (text = '', type = 'alert-error') => {
        let feedback = document.createElement('div');
        feedback.setAttribute('role', 'alert');
        feedback.classList.add('alert');
        feedback.classList.add(type);
        feedback.innerHTML = `<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>`;
        feedback.innerHTML += text;
        alerts.innerHTML = '';
        alerts.appendChild(feedback);
      },
      'loadFonts': () => {
        let load = () => {
          let h = document.getElementsByTagName('head')[0],
            league = document.createElement('link');
          league.rel = 'stylesheet';
          league.href = 'css/font.css';
          h.appendChild(league);
        };
        const raf = requestAnimationFrame || mozRequestAnimationFrame || webkitRequestAnimationFrame || msRequestAnimationFrame;
        if (raf) {
          raf(load);
        } else {
          window.addEventListener('load', load);
        }
        return quiz;
      }
    };

  quiz.init().start().loadFonts();
}());
