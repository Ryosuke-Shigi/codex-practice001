<?php

namespace App\DTO\LinksLanchar;

enum LinksLancharReadStatus
{
    case Available;
    case Unpublished;
    case Missing;
}
