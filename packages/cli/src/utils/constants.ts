import { Modules } from '@yantrix/codegen';
import { TLanguage } from '../types/common';

export const LANGUAGES = Object.keys(Modules) as TLanguage[];

export const DISABLE_FLAGS = ['/* eslint-disable */', '// @ts-nocheck'];

export const EXIT_ERROR_CODE = 1;

export const EXIT_SUCCESS_CODE = 0;

export const RE_CLASS_NAME = /^[a-z]\w*$/i;
