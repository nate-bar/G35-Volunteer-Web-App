import {
  AutofillMonitor
} from "./chunk-A6WBQHG4.js";
import {
  FormsModule,
  NgControl
} from "./chunk-HX7ETMKQ.js";
import {
  ContentObserver
} from "./chunk-LLWKRF55.js";
import {
  coerceBooleanProperty
} from "./chunk-Y3MNLM3H.js";
import {
  CommonModule
} from "./chunk-HIWNWFUK.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  NgModule,
  NgZone,
  Optional,
  Renderer2,
  Self,
  Subject,
  ViewChild,
  setClassMetadata,
  takeUntil,
  ɵɵProvidersFeature,
  ɵɵclassProp,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵhostProperty,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵqueryRefresh,
  ɵɵviewQuery
} from "./chunk-4VTEDE5V.js";

// node_modules/mdb-angular-ui-kit/fesm2022/mdb-angular-ui-kit-forms.mjs
var _c0 = ["notchLeading"];
var _c1 = ["notchMiddle"];
var _c2 = ["*"];
var MdbAbstractFormControl = class _MdbAbstractFormControl {
  stateChanges;
  input;
  labelActive;
  static ɵfac = function MdbAbstractFormControl_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbAbstractFormControl)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _MdbAbstractFormControl
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbAbstractFormControl, [{
    type: Directive
  }], null, null);
})();
var MdbLabelDirective = class _MdbLabelDirective {
  constructor() {
  }
  static ɵfac = function MdbLabelDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbLabelDirective)();
  };
  static ɵdir = ɵɵdefineDirective({
    type: _MdbLabelDirective,
    selectors: [["", "mdbLabel", ""]],
    exportAs: ["mdbLabel"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbLabelDirective, [{
    type: Directive,
    args: [{
      // eslint-disable-next-line @angular-eslint/directive-selector
      selector: "[mdbLabel]",
      exportAs: "mdbLabel"
    }]
  }], () => [], null);
})();
var MdbFormControlComponent = class _MdbFormControlComponent {
  _renderer;
  _contentObserver;
  _elementRef;
  _ngZone;
  _notchLeading;
  _notchMiddle;
  _formControl;
  _label;
  outline = true;
  display = true;
  get input() {
    return this._formControl.input;
  }
  constructor(_renderer, _contentObserver, _elementRef, _ngZone) {
    this._renderer = _renderer;
    this._contentObserver = _contentObserver;
    this._elementRef = _elementRef;
    this._ngZone = _ngZone;
  }
  _destroy$ = new Subject();
  _notchLeadingLength = 9;
  _labelMarginLeft = 0;
  _labelGapPadding = 8;
  _labelScale = 0.8;
  _recalculateGapWhenVisible = false;
  ngAfterContentInit() {
    if (this._label) {
      setTimeout(() => {
        this._updateBorderGap();
      }, 0);
    } else {
      this._renderer.addClass(this.input, "placeholder-active");
    }
    this._updateLabelActiveState();
    if (this._label) {
      this._contentObserver.observe(this._label.nativeElement).pipe(takeUntil(this._destroy$)).subscribe(() => {
        this._updateBorderGap();
      });
    }
    this._formControl.stateChanges.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this._updateLabelActiveState();
      if (this._label) {
        this._updateBorderGap();
      }
    });
    this._ngZone.runOutsideAngular(() => {
      this._ngZone.onStable.pipe(takeUntil(this._destroy$)).subscribe(() => {
        if (this._label && this._recalculateGapWhenVisible) {
          this._updateBorderGap();
        }
      });
    });
  }
  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }
  _getLabelWidth() {
    return this._label.nativeElement.clientWidth * this._labelScale + this._labelGapPadding;
  }
  _updateBorderGap() {
    if (this._isHidden()) {
      this._recalculateGapWhenVisible = true;
      return;
    }
    const notchLeadingWidth = `${this._labelMarginLeft + this._notchLeadingLength}px`;
    const notchMiddleWidth = `${this._getLabelWidth()}px`;
    this._notchLeading.nativeElement.style.width = notchLeadingWidth;
    this._notchMiddle.nativeElement.style.width = notchMiddleWidth;
    this._label.nativeElement.style.marginLeft = `${this._labelMarginLeft}px`;
    this._recalculateGapWhenVisible = false;
  }
  _updateLabelActiveState() {
    if (this._isLabelActive()) {
      this._renderer.addClass(this.input, "active");
    } else {
      this._renderer.removeClass(this.input, "active");
    }
  }
  _isLabelActive() {
    return this._formControl && this._formControl.labelActive;
  }
  _isHidden() {
    const el = this._elementRef.nativeElement;
    return !el.offsetHeight && !el.offsetWidth;
  }
  static ɵfac = function MdbFormControlComponent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbFormControlComponent)(ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(ContentObserver), ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgZone));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _MdbFormControlComponent,
    selectors: [["mdb-form-control"]],
    contentQueries: function MdbFormControlComponent_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, MdbAbstractFormControl, 7);
        ɵɵcontentQuery(dirIndex, MdbLabelDirective, 7, ElementRef);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._formControl = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._label = _t.first);
      }
    },
    viewQuery: function MdbFormControlComponent_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c0, 7);
        ɵɵviewQuery(_c1, 7);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._notchLeading = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._notchMiddle = _t.first);
      }
    },
    hostVars: 4,
    hostBindings: function MdbFormControlComponent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("form-outline", ctx.outline)("d-block", ctx.display);
      }
    },
    ngContentSelectors: _c2,
    decls: 7,
    vars: 0,
    consts: [["notchLeading", ""], ["notchMiddle", ""], [1, "form-notch"], [1, "form-notch-leading"], [1, "form-notch-middle"], [1, "form-notch-trailing"]],
    template: function MdbFormControlComponent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef();
        ɵɵprojection(0);
        ɵɵelementStart(1, "div", 2);
        ɵɵelement(2, "div", 3, 0)(4, "div", 4, 1)(6, "div", 5);
        ɵɵelementEnd();
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbFormControlComponent, [{
    type: Component,
    args: [{
      selector: "mdb-form-control",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: '<ng-content></ng-content>\n<div class="form-notch">\n  <div #notchLeading class="form-notch-leading"></div>\n  <div #notchMiddle class="form-notch-middle"></div>\n  <div class="form-notch-trailing"></div>\n</div>\n'
    }]
  }], () => [{
    type: Renderer2
  }, {
    type: ContentObserver
  }, {
    type: ElementRef
  }, {
    type: NgZone
  }], {
    _notchLeading: [{
      type: ViewChild,
      args: ["notchLeading", {
        static: true
      }]
    }],
    _notchMiddle: [{
      type: ViewChild,
      args: ["notchMiddle", {
        static: true
      }]
    }],
    _formControl: [{
      type: ContentChild,
      args: [MdbAbstractFormControl, {
        static: true
      }]
    }],
    _label: [{
      type: ContentChild,
      args: [MdbLabelDirective, {
        static: true,
        read: ElementRef
      }]
    }],
    outline: [{
      type: HostBinding,
      args: ["class.form-outline"]
    }],
    display: [{
      type: HostBinding,
      args: ["class.d-block"]
    }]
  });
})();
var MdbInputDirective = class _MdbInputDirective {
  _elementRef;
  _renderer;
  _ngControl;
  _autofill;
  constructor(_elementRef, _renderer, _ngControl, _autofill) {
    this._elementRef = _elementRef;
    this._renderer = _renderer;
    this._ngControl = _ngControl;
    this._autofill = _autofill;
  }
  stateChanges = new Subject();
  _focused = false;
  _autofilled = false;
  _color = "";
  ngAfterViewInit() {
    if (typeof getComputedStyle === "function") {
      this._color = getComputedStyle(this._elementRef.nativeElement).color;
      if (this._hasTypeInterferingPlaceholder()) {
        this._updateTextColorForDateType();
      }
    }
    this._autofill.monitor(this.input).subscribe((event) => {
      this._autofilled = event.isAutofilled;
      this.stateChanges.next();
    });
  }
  _currentNativeValue;
  get disabled() {
    if (this._ngControl && this._ngControl.disabled !== null) {
      return this._ngControl.disabled;
    }
    return this._disabled;
  }
  set disabled(value) {
    this._disabled = coerceBooleanProperty(value);
  }
  _disabled = false;
  get readonly() {
    return this._readonly;
  }
  set readonly(value) {
    if (value) {
      this._renderer.setAttribute(this._elementRef.nativeElement, "readonly", "");
    } else {
      this._renderer.removeAttribute(this._elementRef.nativeElement, "readonly");
    }
    this._readonly = coerceBooleanProperty(value);
  }
  _readonly = false;
  get value() {
    return this._elementRef.nativeElement.value;
  }
  set value(value) {
    if (value !== this.value) {
      this._elementRef.nativeElement.value = value;
      this._value = value;
      this.stateChanges.next();
    }
  }
  _value;
  _updateTextColorForDateType() {
    const actualColor = getComputedStyle(this._elementRef.nativeElement).color;
    this._color = actualColor !== "rgba(0, 0, 0, 0)" ? actualColor : this._color;
    const color = this.labelActive ? this._color : `transparent`;
    this._renderer.setStyle(this._elementRef.nativeElement, "color", color);
  }
  _onFocus() {
    this._focused = true;
    if (this._hasTypeInterferingPlaceholder()) {
      this._updateTextColorForDateType();
    }
    this.stateChanges.next();
  }
  _onBlur() {
    this._focused = false;
    if (this._hasTypeInterferingPlaceholder()) {
      this._updateTextColorForDateType();
    }
    this.stateChanges.next();
  }
  ngDoCheck() {
    const value = this._elementRef.nativeElement.value;
    if (this._currentNativeValue !== value) {
      this._currentNativeValue = value;
      this.stateChanges.next();
    }
  }
  get hasValue() {
    return this._elementRef.nativeElement.value !== "";
  }
  get focused() {
    return this._focused;
  }
  get autofilled() {
    return this._autofilled;
  }
  get input() {
    return this._elementRef.nativeElement;
  }
  get labelActive() {
    return this.focused || this.hasValue || this.autofilled;
  }
  _hasTypeInterferingPlaceholder() {
    const typesArray = ["date", "datetime-local", "time", "month", "week"];
    return typesArray.includes(this._elementRef.nativeElement.type);
  }
  static ngAcceptInputType_disabled;
  static ngAcceptInputType_readonly;
  ngOnDestroy() {
    this._autofill.stopMonitoring(this.input);
  }
  static ɵfac = function MdbInputDirective_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbInputDirective)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(NgControl, 10), ɵɵdirectiveInject(AutofillMonitor));
  };
  static ɵdir = ɵɵdefineDirective({
    type: _MdbInputDirective,
    selectors: [["", "mdbInput", ""]],
    hostVars: 1,
    hostBindings: function MdbInputDirective_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("focus", function MdbInputDirective_focus_HostBindingHandler() {
          return ctx._onFocus();
        })("blur", function MdbInputDirective_blur_HostBindingHandler() {
          return ctx._onBlur();
        });
      }
      if (rf & 2) {
        ɵɵhostProperty("disabled", ctx.disabled);
      }
    },
    inputs: {
      disabled: "disabled",
      readonly: "readonly",
      value: "value"
    },
    exportAs: ["mdbInput"],
    features: [ɵɵProvidersFeature([{
      provide: MdbAbstractFormControl,
      useExisting: _MdbInputDirective
    }])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbInputDirective, [{
    type: Directive,
    args: [{
      // eslint-disable-next-line @angular-eslint/directive-selector
      selector: "[mdbInput]",
      exportAs: "mdbInput",
      providers: [{
        provide: MdbAbstractFormControl,
        useExisting: MdbInputDirective
      }]
    }]
  }], () => [{
    type: ElementRef
  }, {
    type: Renderer2
  }, {
    type: NgControl,
    decorators: [{
      type: Optional
    }, {
      type: Self
    }]
  }, {
    type: AutofillMonitor
  }], {
    disabled: [{
      type: HostBinding,
      args: ["disabled"]
    }, {
      type: Input,
      args: ["disabled"]
    }],
    readonly: [{
      type: Input,
      args: ["readonly"]
    }],
    value: [{
      type: Input
    }],
    _onFocus: [{
      type: HostListener,
      args: ["focus"]
    }],
    _onBlur: [{
      type: HostListener,
      args: ["blur"]
    }]
  });
})();
var MdbFormsModule = class _MdbFormsModule {
  static ɵfac = function MdbFormsModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MdbFormsModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MdbFormsModule,
    declarations: [MdbFormControlComponent, MdbInputDirective, MdbLabelDirective],
    imports: [CommonModule, FormsModule],
    exports: [MdbFormControlComponent, MdbInputDirective, MdbLabelDirective]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, FormsModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MdbFormsModule, [{
    type: NgModule,
    args: [{
      declarations: [MdbFormControlComponent, MdbInputDirective, MdbLabelDirective],
      exports: [MdbFormControlComponent, MdbInputDirective, MdbLabelDirective],
      imports: [CommonModule, FormsModule]
    }]
  }], null, null);
})();
export {
  MdbAbstractFormControl,
  MdbFormControlComponent,
  MdbFormsModule,
  MdbInputDirective,
  MdbLabelDirective
};
//# sourceMappingURL=mdb-angular-ui-kit_forms.js.map
