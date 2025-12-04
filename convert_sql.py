import re
import sys

def convert_mysql_to_postgres(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all db.query calls
    pattern = r'(db\.query\s*\(\s*[`"\'])(.*?)([`"\'])'
    
    def replace_placeholders(match):
        prefix = match.group(1)
        sql = match.group(2)
        suffix = match.group(3)
        
        # Count ? placeholders
        count = sql.count('?')
        if count == 0:
            return match.group(0)
        
        # Replace ? with $1, $2, $3, etc.
        result = sql
        for i in range(count, 0, -1):
            # Replace from right to left to avoid issues
            result = result.replace('?', f'${i}', 1)
        
        # Reverse to get correct order
        for i in range(1, count + 1):
            result = result.replace(f'${count - i + 1}', f'PLACEHOLDER{i}')
        for i in range(1, count + 1):
            result = result.replace(f'PLACEHOLDER{i}', f'${i}')
        
        return prefix + result + suffix
    
    converted = re.sub(pattern, replace_placeholders, content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(converted)
    
    print(f"Converted {file_path}")

if __name__ == "__main__":
    convert_mysql_to_postgres("c:/Generador de QR - copia/backend/index.js")
    convert_mysql_to_postgres("c:/Generador de QR - copia/backend/routes/usuarios.js")
    print("Conversion complete!")
