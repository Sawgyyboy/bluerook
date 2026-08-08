import os
import sys
import argparse
from google import genai
from google.genai import types
from google.genai.errors import APIError
from dotenv import load_dotenv

# Load workspace .env if present
load_dotenv()

def get_client():
    """Initializes the standard Gemini API Client."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] GEMINI_API_KEY environment variable is not set.", file=sys.stderr)
        print("Please export it or add it to a local .env file.", file=sys.stderr)
        sys.exit(1)
    
    # Unified client initialization for google-genai
    return genai.Client(api_key=api_key)

def handle_standard_request(client, model, prompt, system_instruction):
    """Handles standard single-turn text generation (with streaming support)."""
    config = None
    if system_instruction:
        config = types.GenerateContentConfig(system_instruction=system_instruction)
        
    try:
        # Use streaming for premium interactive terminal performance
        response = client.models.generate_content_stream(
            model=model,
            contents=prompt,
            config=config
        )
        print(f"\n--- Gemini ({model}) ---")
        for chunk in response:
            print(chunk.text, end="", flush=True)
        print("\n-------------------------\n")
    except APIError as e:
        print(f"\n[API Error]: {e}", file=sys.stderr)

def handle_chat_session(client, model, system_instruction):
    """Launches a multi-turn persistent terminal chat session."""
    config = None
    if system_instruction:
        config = types.GenerateContentConfig(system_instruction=system_instruction)
        
    print(f"\n=== Starting Chat Session with {model} ===")
    print("Type 'exit' or 'quit' to end the conversation.\n")
    
    # Initialize stateful multi-turn chat
    chat = client.chats.create(model=model, config=config)
    
    while True:
        try:
            user_input = input("You > ").strip()
            if not user_input:
                continue
            if user_input.lower() in ['exit', 'quit']:
                print("Ending session. Goodbye!")
                break
                
            print("Gemini > ", end="", flush=True)
            # Chats also support streaming via send_message_stream
            response = chat.send_message_stream(user_input)
            for chunk in response:
                print(chunk.text, end="", flush=True)
            print("\n")
            
        except (KeyboardInterrupt, EOFError):
            print("\nSession interrupted. Exiting.")
            break
        except APIError as e:
            print(f"\n[API Error]: {e}\n", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(description="BlueRook Premium Gemini CLI Testing Suite")
    parser.add_argument("prompt", type=str, nargs="?", help="The prompt to send to Gemini (omit if running --chat)")
    parser.add_argument("--model", type=str, default="gemini-2.0-flash", help="The targeted Gemini model")
    parser.add_argument("-s", "--system", type=str, default=None, help="System instructions/behavior modifiers")
    parser.add_argument("--chat", action="store_true", help="Launch a persistent multi-turn chat session")
    
    args = parser.parse_args()
    
    if not args.chat and not args.prompt:
        parser.error("You must provide a prompt or run with the --chat flag.")
        
    client = get_client()
    
    if args.chat:
        handle_chat_session(client, args.model, args.system)
    else:
        handle_standard_request(client, args.model, args.prompt, args.system)

if __name__ == "__main__":
    main()
