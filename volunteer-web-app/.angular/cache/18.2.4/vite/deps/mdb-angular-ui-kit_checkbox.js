import {
  FormsModule,
  NG_VALUE_ACCESSOR
} from "./chunk-HX7ETMKQ.js";
import {
  coerceBooleanProperty
} from "./chunk-Y3MNLM3H.js";
import {
  CommonModule
} from "./chunk-HIWNWFUK.js";
import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  NgModule,
  Output,
  forwardRef,
  setClassMetadata,
  ɵɵProvidersFeature,
  ɵɵdefineDirective,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵhostProperty,
  ɵɵlistener
} from "./chunk-4VTEDE5V.js";

// node_modules/mdb-angular-ui-kit/fesm2022/mdb-angular-ui-kit-checkbox.mjs
var MDB_CHECKBOX_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
  useExisting: forwardRef(() => MdbCheckboxDirective),
  multi: true
};
var MdbCheckboxChange = class {
  element;
  checked;
};
var MdbCheckboxDirective = class _MdbCheckboxDirective {
  get checked() {
    return this._checked;
  }
  set checked(value) {
    this._checked = coerceBooleanProperty(value);
  }
  _checked = false;
  get value() {
    return this._value;
  }
  set value(value) {
    this._value = value;
  }
  _value = null;
  get disabled() {
    return this._disabled;
  }
  set disabled(value) {
    this._disabled = coerceBooleanProperty(value);
  }
  _disabled = false;
  checkboxChange = new EventEmitter();
  get isDisabled() {
    return this._disabled;
  }
  get isChecked() {
    return this._checked;
  }
  onCheckboxClick() {
    this.toggle();
  }
  onBlur() {
    this.onTouched();
  }
  constructor() {
  }
  get changeEvent() {
    const newChangeEvent = new MdbCheckboxChange();
    newChangeEvent.element = this;
    newChangeEvent.checked = this.checked;
    return newChangeEvent;
  }
  toggle() {
    if (this.disabled) {
      return;
    }
    this._checked = !this._checked;
    this.onChange(this.checked);
    this.onCheckboxChange();
  }
  onCheckboxChange() {
    this.checkboxChange.emit(this.changeEvent);
  }
  // Control Value Accessor Methods
  onChange = (_) => {
  };
  onTouched = () => {
  };
  writeValue(value) {
    this.value = value;
    this.checked = !!value;
  }
  registerOnChange(fn) {
    this.onChange = fn;
  }
  registerOnTouched(fn) {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this.disabled = isDisabled;
  }
  static ngAcceptInputType_checked;
  static ngAcceptInputType_disabled;
  static ɵfac = function MdbCheckboxDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbCheckboxDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _MdbCheckboxDirective,
    selectors: [["", "mdbCheckbox", ""]],
    hostVars: 2,
    hostBindings: function MdbCheckboxDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function MdbCheckboxDirective_click_HostBindingHandler() {
          return ctx.onCheckboxClick();
        })("blur", function MdbCheckboxDirective_blur_HostBindingHandler() {
          return ctx.onBlur();
        });
      }
      if (rf & 2) {
        ɵɵhostProperty("disabled", ctx.isDisabled)("checked", ctx.isChecked);
      }
    },
    inputs: {
      checked: "checked",
      value: "value",
      disabled: "disabled"
    },
    outputs: {
      checkboxChange: "checkboxChange"
    },
    features: [ɵɵProvidersFeature([MDB_CHECKBOX_VALUE_ACCESSOR])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbCheckboxDirective, [{
    type: Directive,
    args: [{
      // eslint-disable-next-line @angular-eslint/directive-selector
      selector: "[mdbCheckbox]",
      providers: [MDB_CHECKBOX_VALUE_ACCESSOR]
    }]
  }], () => [], {
    checked: [{
      type: Input,
      args: ["checked"]
    }],
    value: [{
      type: Input,
      args: ["value"]
    }],
    disabled: [{
      type: Input,
      args: ["disabled"]
    }],
    checkboxChange: [{
      type: Output
    }],
    isDisabled: [{
      type: HostBinding,
      args: ["disabled"]
    }],
    isChecked: [{
      type: HostBinding,
      args: ["checked"]
    }],
    onCheckboxClick: [{
      type: HostListener,
      args: ["click"]
    }],
    onBlur: [{
      type: HostListener,
      args: ["blur"]
    }]
  });
})();
var MdbCheckboxModule = class _MdbCheckboxModule {
  static ɵfac = function MdbCheckboxModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbCheckboxModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MdbCheckboxModule,
    declarations: [MdbCheckboxDirective],
    imports: [CommonModule, FormsModule],
    exports: [MdbCheckboxDirective]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, FormsModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbCheckboxModule, [{
    type: NgModule,
    args: [{
      declarations: [MdbCheckboxDirective],
      exports: [MdbCheckboxDirective],
      imports: [CommonModule, FormsModule]
    }]
  }], null, null);
})();
export {
  MDB_CHECKBOX_VALUE_ACCESSOR,
  MdbCheckboxChange,
  MdbCheckboxDirective,
  MdbCheckboxModule
};
//# sourceMappingURL=mdb-angular-ui-kit_checkbox.js.map
