def longestPalindrome(s: str) -> str:
    """
    Returns the longest palindromic substring in s.
    If there are multiple, returns the first one found.
    """
    if not s:
        return ""

    start, max_len = 0, 1  # track start index and length of longest palindrome

    def expand(left: int, right: int) -> None:
        """Expand around center and update start/max_len if a longer palindrome is found."""
        nonlocal start, max_len
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        # after loop, the palindrome is s[left+1:right]
        cur_len = right - left - 1
        if cur_len > max_len:
            max_len = cur_len
            start = left + 1

    for i in range(len(s)):
        # odd length palindrome (center at i)
        expand(i, i)
        # even length palindrome (center between i and i+1)
        expand(i, i + 1)

    return s[start:start + max_len]


# Example usage and simple test
if __name__ == "__main__":
    test_cases = [
        ("babad", ["bab", "aba"]),  # either is acceptable
        ("cbbd", ["bb"]),
        ("a", ["a"]),
        ("", [""]),
        ("ac", ["a", "c"]),  # any single char
        ("forgeeksskeegfor", ["geeksskeeg"]),
    ]

    for s, expected in test_cases:
        result = longestPalindrome(s)
        ok = result in expected if isinstance(expected, list) else result == expected
        print(f"Input: {repr(s):<20} Output: {repr(result):<12} {'✅' if ok else '❌'}")