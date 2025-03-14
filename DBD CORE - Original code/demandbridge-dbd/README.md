# Introduction

This is a python project, which helps compile and decompile all PxPLus files, on a given path.

The program will run the desired command over all the subfolders of the parent dbd/


```bash
pip install foobar
```

## Usage

```json
{
    "base_path": "./src", --> Base path for sequential execution
    "output_base_path": "./bin",--> Output path for sequential output result
    "pvx_command": "./pvx", --> Comand to use pvx (Dont Change)
    "compile_flag": "-cpl", --> Flag to compile(-cpl) or decompile (-lst)
    "input_extension": ".pxprg", --> Input extension of all the files
    "output_extension": ".pxp" -->Output extension, can be empty ""
  }
```