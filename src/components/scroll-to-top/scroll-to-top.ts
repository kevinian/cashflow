import { Directive, ElementRef, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Gesture } from 'ionic-angular/gestures/gesture';
declare var Hammer: any

/*
  Generated class for the ScrollToTop directive.

  See https://angular.io/docs/ts/latest/api/core/index/DirectiveMetadata-class.html
  for more info on Angular 2 Directives.
*/
@Directive({
  selector: '[scroll-to-top]' // Attribute selector
})
export class ScrollToTop implements OnInit, OnDestroy {
  @Output() doubleTapped = new EventEmitter();
  private _el: HTMLElement;
  private _tapGesture: Gesture;

  constructor(private el: ElementRef) {
    this._el = el.nativeElement;
  }
  
  ngOnInit() {
    this._tapGesture = new Gesture(this._el, {
      recognizers: [
        [Hammer.Tap, {taps: 2}]
      ]
    });
    this._tapGesture.listen();
    this._tapGesture.on('tap', e => {
      this.doubleTapped.emit();
    });
  }

  ngOnDestroy() {
    this._tapGesture.destroy();
  }

}
