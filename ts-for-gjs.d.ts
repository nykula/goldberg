// tslint:disable:no-reference
// tslint:disable:no-implicit-dependencies
// tslint:disable:no-submodule-imports
/// <reference path="node_modules/ts-for-gjs/out/print.d.ts" />
import * as Gdk from "ts-for-gjs/out/Gdk";
import * as GdkPixbuf from "ts-for-gjs/out/GdkPixbuf";
import * as Gio from "ts-for-gjs/out/Gio";
import * as Gjs from "ts-for-gjs/out/Gjs";
import * as GLib from "ts-for-gjs/out/GLib";
import * as GObject from "ts-for-gjs/out/GObject";
import * as Gtk from "ts-for-gjs/out/Gtk";
import * as Pango from "ts-for-gjs/out/Pango";
import * as WebKit2 from "ts-for-gjs/out/WebKit2";

declare global {
  const ARGV: string[];
  const imports: typeof Gjs & {
    [key: string]: any;
    gi: {
      Gdk: typeof Gdk;
      GdkPixbuf: typeof GdkPixbuf;
      Gio: typeof Gio;
      GLib: typeof GLib;
      GObject: typeof GObject;
      Gtk: typeof Gtk;
      Pango: typeof Pango;
      WebKit2: typeof WebKit2;
    };
    searchPath: string[];
  };
}

export {};
