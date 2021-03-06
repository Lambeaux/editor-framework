'use strict';

// ==========================
// exports
// ==========================

function ui_slider (text) {
  let el = document.createElement('ui-slider');
  el.innerText = text;

  return el;
}

module.exports = ui_slider;

// ==========================
// internal
// ==========================

const JS = require('../../../share/js-utils');
const MathUtils = require('../../../share/math');
const DomUtils = require('../utils/dom-utils');
const FocusMgr = require('../utils/focus-mgr');
const Focusable = require('../behaviors/focusable');
const InputState = require('../behaviors/input-state');

class SliderElement extends window.HTMLElement {
  get value () { return this._value; }
  set value (val) {
    if ( this._value !== val ) {
      this._value = val;
      this._updateNubbinAndInput();
    }
  }

  /**
   * @property readonly
   */
  get readonly () {
    return this.getAttribute('readonly') !== null;
  }
  set readonly (val) {
    if (val) {
      this.setAttribute('readonly', '');
    } else {
      this.removeAttribute('readonly');
    }
  }

  createdCallback () {
    let root = this.createShadowRoot();
    root.innerHTML = `
      <div class="wrapper">
        <div class="track"></div>
        <div class="nubbin"></div>
      </div>
      <input></input>
    `;
    root.insertBefore(
      DomUtils.createStyleElement('editor-framework://dist/css/elements/slider.css'),
      root.firstChild
    );

    this._wrapper = root.querySelector('.wrapper');
    this._track = root.querySelector('.track');
    this._nubbin = root.querySelector('.nubbin');
    this._input = root.querySelector('input');

    // init attr
    let attrMin = this.getAttribute('min');
    this.min = attrMin !== null ? parseFloat(attrMin) : 0.0;

    let attrMax = this.getAttribute('max');
    this.max = attrMax !== null ? parseFloat(attrMax) : 1.0;

    let attrValue = this.getAttribute('value');
    this._value = attrValue !== null ? parseFloat(attrValue) : 0.0;
    this._value = this._initValue = MathUtils.clamp( this._value, this.min, this.max );

    this._step = (this.max - this.min)/100;
    this._dragging = false;

    //
    this._updateNubbinAndInput();

    //
    this._initFocusable([this._input, this._wrapper]);
    this._initInputState(this._input);

    // process events
    this.addEventListener('mousedown', this._mouseDownHandler);
    this.addEventListener('focus-changed', this._focusChangedHandler);

    this._wrapper.addEventListener('keydown', this._wrapperKeyDownHandler.bind(this));
    this._wrapper.addEventListener('mousedown', this._wrapperMouseDownHandler.bind(this));

    this._input.addEventListener('keydown', event => {
      event.stopPropagation();
    });
    this._input.addEventListener('input', event => {
      event.stopPropagation();
    });
  }

  _mouseDownHandler (event) {
    DomUtils.acceptEvent(event);
    FocusMgr._setFocusElement(this);
    this._input.select();
  }

  _wrapperMouseDownHandler (event) {
    DomUtils.acceptEvent(event);
    FocusMgr._setFocusElement(this);
    this._wrapper.focus();

    if ( this.readonly ) {
      return;
    }

    this._initValue = this._value;
    this._dragging = true;

    let rect = this._track.getBoundingClientRect();
    let ratio = (event.clientX - rect.left)/this._track.clientWidth;

    this._nubbin.style.left = `${ratio*100}%`;
    this._value = this.min + ratio * (this.max - this.min);
    this._input.value = this._value.toFixed(2);

    DomUtils.fire(this, 'change', {
      bubbles: true,
      detail: {
        value: this._value,
      }
    });

    DomUtils.startDrag('ew-resize', event, event => {
      let ratio = (event.clientX - rect.left)/this._track.clientWidth;
      ratio = MathUtils.clamp( ratio, 0, 1 );

      this._nubbin.style.left = `${ratio*100}%`;
      this._value = this.min + ratio * (this.max - this.min);
      this._input.value = this._value.toFixed(2);

      DomUtils.fire(this, 'change', {
        bubbles: true,
        detail: {
          value: this._value,
        }
      });
    }, () => {
      this._dragging = false;
      this.confirm();
    });
  }

  _wrapperKeyDownHandler (event) {
    // keydown 'enter'
    if (event.keyCode === 13) {
      DomUtils.acceptEvent(event);

      this._input._initValue = this._input.value;
      this._input.focus();
      this._input.select();
    }
    // keydown 'esc'
    else if (event.keyCode === 27) {
      DomUtils.acceptEvent(event);
      if ( this._dragging ) {
        this._dragging = false;
        DomUtils.cancelDrag();
        this.cancel();
      }
    }
    // left-arrow
    else if ( event.keyCode === 37 ) {
      DomUtils.acceptEvent(event);

      if ( this.readonly ) {
        return;
      }

      let step = this._step;
      if ( event.shiftKey ) {
        step *= 10.0;
      }
      this._value = MathUtils.clamp(this._value-step, this.min, this.max);
      this._initValue = this._value;
      this._updateNubbinAndInput();

      DomUtils.fire(this, 'change', {
        bubbles: true,
        detail: {
          value: this._value,
        }
      });
    }
    // right-arrow
    else if ( event.keyCode === 39 ) {
      DomUtils.acceptEvent(event);

      if ( this.readonly ) {
        return;
      }

      let step = this._step;
      if ( event.shiftKey ) {
        step *= 10.0;
      }
      this._value = MathUtils.clamp(this._value+step, this.min, this.max);
      this._initValue = this._value;
      this._updateNubbinAndInput();

      DomUtils.fire(this, 'change', {
        bubbles: true,
        detail: {
          value: this._value,
        }
      });
    }
  }

  _parseInput () {
    let val = parseFloat(this._input.value);
    if ( isNaN(val) ) {
      val = parseFloat(this._input._initValue);
    }

    val = MathUtils.clamp( val, this.min, this.max );

    return val;
  }

  _updateNubbin () {
    let ratio = (this._value-this.min)/(this.max-this.min);
    this._nubbin.style.left = `${ratio*100}%`;
  }

  _updateNubbinAndInput () {
    let ratio = (this._value-this.min)/(this.max-this.min);
    this._nubbin.style.left = `${ratio*100}%`;
    this._input.value = this._value.toFixed(2);
  }

  confirm () {
    this._initValue = this._value;
    this._updateNubbinAndInput();

    DomUtils.fire(this, 'confirm', {
      bubbles: true,
      detail: {
        value: this._value,
      },
    });
    DomUtils.fire(this, 'end-editing', { bubbles: true });
  }

  cancel () {
    this._value = this._initValue;
    this._updateNubbinAndInput();

    DomUtils.fire(this, 'change', {
      bubbles: true,
      detail: {
        value: this._value,
      },
    });
    DomUtils.fire(this, 'cancel', {
      bubbles: true,
      detail: {
        value: this._value,
      },
    });
    DomUtils.fire(this, 'end-editing', { bubbles: true });
  }

  _onInputConfirm ( inputEL, pressEnter ) {
    if ( !this.readonly ) {
      let value = this._parseInput();

      inputEL.value = value;
      inputEL._initValue = value;

      this._value = value;
      this._initValue = value;
      this._updateNubbin();

      DomUtils.fire(this, 'confirm', {
        bubbles: true,
        detail: {
          value: this._value,
          confirmByEnter: pressEnter,
        },
      });
      DomUtils.fire(this, 'end-editing', { bubbles: true });
    }

    if ( pressEnter ) {
      // blur inputEL, focus to wrapper
      this._wrapper.focus();
    }
  }

  _onInputCancel ( inputEL, pressEsc ) {
    if ( !this.readonly ) {
      inputEL.value = inputEL._initValue;
      let value = this._parseInput();

      inputEL.value = value;
      this._value = value;
      this._initValue = value;
      this._updateNubbin();

      DomUtils.fire(this, 'change', {
        bubbles: true,
        detail: {
          value: this._value,
        },
      });
      DomUtils.fire(this, 'cancel', {
        bubbles: true,
        detail: {
          value: this._value,
          cancelByEsc: pressEsc,
        },
      });
      DomUtils.fire(this, 'end-editing', { bubbles: true });
    }

    if ( pressEsc ) {
      // blur inputEL, focus to wrapper
      this._wrapper.focus();
    }
  }

  _onInputChange () {
    let value = this._parseInput();

    this._value = value;
    this._updateNubbin();

    DomUtils.fire(this, 'change', {
      bubbles: true,
      detail: {
        value: this._value,
      },
    });
  }

  _focusChangedHandler () {
    if ( !this.focused ) {
      this._unselect(this._input);
    }
  }
}

JS.addon(SliderElement.prototype, Focusable);
JS.addon(SliderElement.prototype, InputState);

ui_slider.element = SliderElement;
