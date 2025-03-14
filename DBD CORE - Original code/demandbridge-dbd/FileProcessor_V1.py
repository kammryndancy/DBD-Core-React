import os
import json
import subprocess
import logging
import shutil

with open("./Config.json", "r") as config_file:
    config = json.load(config_file)

base_path = config["base_path"]
output_base_path= config["output_base_path"]
pvx_command = config["pvx_command"]
pxplus_command = config["pxplus_command"]
compile_flag = config["compile_flag"]
input_extension_program = config["input_extension_program"]
input_extension_keyed = config["input_extension_keyed"]
output_extension_program = config["output_extension_program"]
output_extension_keyed = config["output_extension_keyed"]

logging.basicConfig(filename='FileProcessor.log', encoding='utf-8', level=logging.DEBUG)


if not os.path.exists(output_base_path):
    os.makedirs(output_base_path)

def execute_command(command, process_name):
    try:
        logging.info("Executing: {}".format(' '.join(command)))

        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        stdout, stderr = process.communicate()
        if "Validate" in process_name:
            result = stdout.decode("utf-8").strip()
            return result
        else:
            if stderr:
                logging.error("Error during conversion with file "+ file)
            else:
                logging.info("Convertion Done "+ file)
    except Exception as e:
        logging.error("Error executing the comand to {}: {}".format(src_file, e))


for root, dirs, files in os.walk(base_path):
    for file in files:
        
        logging.info("File been process: " + file )
        src_file = os.path.join(root, file)

        result = ""
        relative_path = os.path.relpath(root, base_path)
        output_folder = os.path.join(output_base_path, relative_path)
        output_file = ""

        if compile_flag == "-cpl":
            if ".pxkey" in src_file or ".pxprg" in src_file:
                result = "Keyed File" if ".pxkey" in src_file else "Program"
                output_file = os.path.join(output_folder, os.path.splitext(file)[0])
            else:
                output_file = os.path.join(output_folder, os.path.splitext(file)[0])

        else:
            validate_command = [
                os.path.abspath(pxplus_command),
                "ValidateFile",
                "-arg",
                os.path.abspath(src_file)
            ]
            result = execute_command(validate_command,"Validate")
            output_file = os.path.join(output_folder, os.path.splitext(file)[0] + os.path.splitext(file)[1])

        if not os.path.exists(output_folder):
            os.makedirs(output_folder)

        if "Keyed File" in result:
            logging.info("Converting Keyed File "+ file)
            convert_program = "ConvertTextToBinary" if compile_flag == "-cpl" else "ConvertBinaryToText"
            keyed_command = [
                os.path.abspath(pxplus_command),
                convert_program,
                "-arg",
                os.path.abspath(src_file),
                os.path.abspath(output_file + output_extension_keyed)   
            ]

            execute_command(keyed_command,"Keyed")
                
        elif "Program" in result:
            logging.info("Converting Program File")

            if file.endswith(input_extension_program):
                                    
                program_command = [
                    os.path.abspath(pvx_command),
                    compile_flag,
                    os.path.abspath(src_file),
                    os.path.abspath(output_file + output_extension_program)
                ]

                execute_command(program_command,"program")
        else:
            logging.info("Copying other file")
            try:
                if not os.path.exists(src_file):
                    raise FileNotFoundError("The origin file doesnt exist: " + src_file)
                
                if not os.path.exists(output_folder):
                    os.makedirs(output_folder)

                shutil.copy2(src_file, output_file)
                logging.info("Copying file to: "+ output_file)

            except Exception as e:
                logging.error("Error copying the file: " + src_file)





