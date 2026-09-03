import EditorRegistry from './EditorRegistry.js';

import StringEditor from '../editors/scalar/StringEditor.js';
import TextareaEditor from '../editors/scalar/TextareaEditor.js';
import IntEditor from '../editors/scalar/IntEditor.js';
import NumberEditor from '../editors/scalar/NumberEditor.js';
import BigIntEditor from '../editors/scalar/BigIntEditor.js';
import FloatEditor from '../editors/scalar/FloatEditor.js';
import DecimalEditor from '../editors/scalar/DecimalEditor.js';
import BooleanEditor from '../editors/scalar/BooleanEditor.js';
import DateTimeEditor from '../editors/scalar/DateTimeEditor.js';
import JsonEditor from '../editors/scalar/JsonEditor.js';
import BytesEditor from '../editors/scalar/BytesEditor.js';
import EnumEditor from '../editors/scalar/EnumEditor.js';

import CommaSeparatedEditor
  from '../editors/structured/CommaSeparatedEditor.js';

import PredefinedKeyValueEditor
  from '../editors/structured/PredefinedKeyValueEditor.js';

import CustomKeyValueEditor
  from '../editors/structured/CustomKeyValueEditor.js';

export default function createDefaultRegistry() {
  return new EditorRegistry().registerMany({
    text: StringEditor,
    string: StringEditor,
    textarea: TextareaEditor,

    int: IntEditor,

    number: NumberEditor,
    float: FloatEditor,
    decimal: DecimalEditor,

    bigint: BigIntEditor,

    boolean: BooleanEditor,
    checkbox: BooleanEditor,

    datetime: DateTimeEditor,
    'datetime-local': DateTimeEditor,

    json: JsonEditor,
    bytes: BytesEditor,
    enum: EnumEditor,
    select: EnumEditor,

    'comma-separated': CommaSeparatedEditor,
    'key-value': PredefinedKeyValueEditor,
    'custom-key-value': CustomKeyValueEditor
  });
}
