import React, { useRef, useEffect } from 'react';

interface TextAreaAutoResizeProps {
    label: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
}

const TextAreaAutoResize: React.FC<TextAreaAutoResizeProps> = ({ label, value, onChange, placeholder }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const resizeTextArea = () => {
            const textArea = textareaRef.current;
            if (textArea) {
                textArea.style.height = 'auto';
                textArea.style.height = `${textArea.scrollHeight}px`;
            }
        };

        resizeTextArea();
        window.addEventListener('resize', resizeTextArea);
        return () => window.removeEventListener('resize', resizeTextArea);
    }, [value]);

    return (
        <div className="flex flex-col">
            <label htmlFor="additionalNotes" className="label-style">{label}</label>
            <textarea
                ref={textareaRef}
                id="additionalNotes"
                name="additionalNotes"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="auto-resize mt-1 p-4 border border-gray-600 bg-gray-700 text-white rounded-md w-full text-lg focus:ring focus:ring-blue-500"

            />
        </div>
    );
};

export default TextAreaAutoResize;
